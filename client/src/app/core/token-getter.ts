export function tokenGetter() {
  // HACK: Any way to use the method in the account service here?
  var response = localStorage.getItem('authResponse');
  if (response) {
    var authResponse = JSON.parse(response ?? "");
    return authResponse?.token;
  } else {
    return "";
  }
}
