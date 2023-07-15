
document.querySelector('button1').addEventListener('click', function(){
  document.querySelector('button1').classList.toggle('button1Click');
  document.querySelector('button2').classList.remove('button2Click');
});


document.querySelector('button2').addEventListener('click', function(){
  document.querySelector('button2').classList.toggle('button2Click');
  document.querySelector('button1').classList.remove('button1Click');
});



const phoneInputField = document.querySelector("#phone");
const phoneInput = window.intlTelInput(phoneInputField, {
  utilsScript:
    "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js",
});

const info = document.querySelector(".alert-info");

function process(event) {
event.preventDefault();

const phoneNumber = phoneInput.getNumber();

info.style.display = "";
info.innerHTML = `Phone number in E.164 format: <strong>${phoneNumber}</strong>`;
console.log(phoneNumber);
}