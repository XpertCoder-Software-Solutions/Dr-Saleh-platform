-- Courses the admin links to an article ("دورات ذات صلة"). Empty = pick automatically.
ALTER TABLE "articles" ADD COLUMN "relatedCourseIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
