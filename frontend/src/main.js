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

const loadFeed = () => {
    apiCall('job/feed?start=0','GET', null,{
        'Content-type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('lurkforwork_token')}` ,
    },function(data){
        //feedcard(2.2)
        console.log(data);
        const feedContainer = document.getElementById('feed-content');
        const templateCard = document.getElementById('feed-card');
        if (data.length === 0) {
            feedContainer.innerHTML = '<p> No jobs to display. Follow more people to see their posts. </p>';
            return;
        }
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        data.forEach(job => {
            const jobCard = document.createElement('div');
            jobCard.className = 'card h-100';
            jobCard.innerHTML = `
                ${job.image ? `<img src="${job.image}" class="card-img-top" alt="Job image">` : ''}
                <div class="card-body">
                    <h5 class="card-title">${job.title}</h5>
                    <p class="card-text"><strong>Starting Date:</strong> ${formatStartDate(job.start)}</p>
                    <div class="d-flex align-items-center mb-2">
                        <div class="like me-2">
                            <button id="like" class="btn btn-sm btn-outline-primary">Like</button>
                            <span class="ms-1">${job.likes.length}</span>
                        </div>
                        <button class="btn btn-link btn-sm view-likers" data-job-id="${job.id}">
                            View ${job.likes.length} ${job.likes.length === 1 ? 'like' : 'likes'}
                        </button>
                    </div>
                    <p class="card-text job-description">${job.description}</p>
                    <div class="text-muted">
                        ${job.comments.length} ${job.comments.length === 1 ? 'comment' : 'comments'}
                    </div>
                </div>
                <div class="card-footer">
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="fw-bold">Posted by: User ${job.userId}</span>
                        <span class="text-muted">${formatTimestamp(job.createdAt)}</span>
                    </div>
                </div>`;
            feedContainer.appendChild(jobCard);
            //view like（2.3.1）
            jobCard.querySelector('.view-likers').addEventListener('click', () => {
                const likeinside = document.getElementById('likeinside');
                const likepeople = document.getElementById('likepeople');
                likeinside.style.display = 'flex';
                document.getElementById('closelikePeople').addEventListener('click',() => {
                    likeinside.style.display = 'none';
                }
                );
                if(job.likes.length===0){
                    likepeople.innerHTML = `<p class="text-center my-3">No likes yet</p>`;
                    return;
                }
                const listlikePeople = document.createElement('div');
                listlikePeople.className = 'list-group list-group-flush';
                job.likes.forEach(user => {
                    const userNameElement = document.createElement('a');
                    userNameElement.href='#';
                    userNameElement.className= 'list-group-item list-group-item-action';
                    userNameElement.innerHTML=
                    `<div class="d-flex justify-content-between align-items-center">
                    <span>${user.userName || `User ${user.userId}`}</span>
                    <small class="text-muted">ID: ${user.userId}</small>
                    </div>`;
                    userNameElement.addEventListener('click', ()=>{
                        likeinside.style.display = 'none';
                    });
                listlikePeople.appendChild(userNameElement);
                });
                likepeople.appendChild(listlikePeople);
            });
        });
    }); 
};
function formatTimestamp(timestamp) {
    const now = new Date();
    const postDate = new Date(timestamp);
    const diffInHours = (now - postDate) / (1000 * 60 * 60);
    if (diffInHours < 24) {
        const diffInMinutes = Math.floor(diffInHours * 60);
        const hours = Math.floor(diffInHours);
        const minutes = diffInMinutes % 60;
        return `${hours}h ${minutes}m ago`;
    } else {
        const day = String(postDate.getDate()).padStart(2, '0');
        const month = String(postDate.getMonth() + 1).padStart(2, '0');
        const year = postDate.getFullYear();
        return `${day}/${month}/${year}`;
    }
}
function formatStartDate(timestamp) {
    const startDate = new Date(timestamp);
    const day = String(startDate.getDate()).padStart(2, '0');
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    const year = startDate.getFullYear();
    return `${day}/${month}/${year}`;
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
