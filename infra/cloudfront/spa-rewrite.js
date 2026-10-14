// CloudFront Function (runtime cloudfront-js-2.0), viewer-request, DEFAULT behavior only.
// Sends client-side routes (/courses/123, /account/orders, ...) to index.html so the
// React router can render them. Requests for real files (anything with an extension)
// pass through. /api/* and /uploads/* use their own behaviors and never reach this.
function handler(event) {
  var request = event.request;
  var uri = request.uri;
  var last = uri.substring(uri.lastIndexOf('/') + 1);
  if (last.indexOf('.') === -1) {
    request.uri = '/index.html';
  }
  return request;
}
