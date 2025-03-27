import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';
function showError(data){
    const errorMessage = document.getElementById('errorMessage');
    document.getElementById('errorPopup').style.display = 'flex';
    document.getElementById('errorPopup').style.justifyContent = 'center';
    document.getElementById('errorPopup').style.alignItems = 'center';
    errorMessage.textContent = data;
    document.getElementById('closePopup').addEventListener('click',() => {
        document.getElementById('errorPopup').style.display = 'none';
    }
    );
}
function apiCall(path,method,body,headers,successCallback){
    fetch(`http://localhost:5005/${path}`,{
    method:method,
    body: body,
    headers:headers
}).then((response) => {
     response.json().then((data)=> {
        if (response.status === 200){
            successCallback(data);
    }else{
        showError(data.error);
    }
    });
});
}
document.getElementById('btn-rsubmit').addEventListener('click',() => {
    const email = document.getElementById('r-email').value;
    const name = document.getElementById('r-name').value;
    const password = document.getElementById('r-password').value;
    const cpassword = document.getElementById('r-cpassword').value;
    if(password !== cpassword){
        alert('Passwords dont match');
    }
    apiCall('auth/register','POST',JSON.stringify({
        email:email,
        name:name,
        password:password
    }),{
        'Content-type': 'application/json'
    }, function(data){
            localStorage.setItem('lurkforwork_token',data.token);
            showPage('home');
            console.log(token);
            loadFeed();
    });
});
document.getElementById('btn-lsubmit').addEventListener('click',() => {
    const email = document.getElementById('l-email').value;
    const password = document.getElementById('l-password').value;
    apiCall('auth/login','POST',JSON.stringify({
        email:email,
        password:password
    }),{
        'Content-type': 'application/json',
    },function(data){
        localStorage.setItem('lurkforwork_token',data.token);
        showPage('home');
        loadFeed();
});
});
document.getElementById('btn-logout').addEventListener('click',() => {
        localStorage.removeItem('lurkforwork_token');
        showPage('login');
        localStorage.setItem(null);
});
const showPage = (pageName) => {
    const pages = document.querySelectorAll('.page');
        for(const page of pages) {
            page.classList.add('hide');
        }
        document.getElementById(`page-${pageName}`).classList.remove('hide');
}



const buttons = document.querySelectorAll('.toPage');
buttons.forEach(button => {
  button.addEventListener('click', () => {
    const pageName = button.innerText;
    showPage(pageName)
  })
});

let token = localStorage.getItem('lurkforwork_token');
if(token){
    showPage('home');
}else{
    showPage('login');
}
