// setInterval(function () {
//   console.log("running");
//   chrome.identity.getAuthToken({
//     interactive: true
//   }, function (token) {
//     console.log("token " + token);
//     // $.ajax({
//     //   url: "https://www.googleapis.com/plus/v1/people/me",
//     //   type: "GET",
//     //   beforeSend: function (xhr) {
//     //     xhr.setRequestHeader('Content-Type', 'application/json');
//     //     xhr.setRequestHeader('Authorization', 'OAuth ' + token);
//     //   },
//     //   success: function (profile) {
//     //     _identity = profile.displayName;
//     //     callback(null, _identity);
//     //   },
//     //   error: function (problem) {
//     //     callback(problem);
//     //   }
//     // });
//   });
// }, 10000);