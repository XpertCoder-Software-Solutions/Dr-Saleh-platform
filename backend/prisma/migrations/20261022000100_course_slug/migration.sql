-- Courses get a URL slug (like books, products and articles). Existing courses are
-- backfilled from the English title; duplicates get -2, -3, … in creation order.
ALTER TABLE "courses" ADD COLUMN "slug" TEXT;

UPDATE "courses" AS c
SET "slug" = s."slug"
FROM (
  SELECT "id",
         CASE WHEN "rn" = 1 THEN "base" ELSE "base" || '-' || "rn" END AS "slug"
  FROM (
    SELECT "id", "base",
           ROW_NUMBER() OVER (PARTITION BY "base" ORDER BY "createdAt", "id") AS "rn"
    FROM (
      SELECT "id", "createdAt",
             COALESCE(
               NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER("titleEn"), '[^a-z0-9]+', '-', 'g')), ''),
               'course'
             ) AS "base"
      FROM "courses"
    ) AS a
  ) AS b
) AS s
WHERE c."id" = s."id";

CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");
