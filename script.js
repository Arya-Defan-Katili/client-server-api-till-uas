const loginButton = document.getElementById('loginButton');
const loginPopup = document.getElementById('loginPopup');
const closeButton = document.getElementById('closeButton');

loginButton.addEventListener("click", function() {
    loginPopup.classList.remove("hidden");
});

closeButton.addEventListener("click", function() {
    loginPopup.classList.add("hidden");
});

const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

togglePassword.addEventListener("click", function() {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
    } else {
        passwordInput.type = "password";
    }
});