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
            localStorage.setItem('lurkforwork_userID',data.userID);
            showPage('home');
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
        localStorage.setItem('lurkforwork_userID',data.userID);
        showPage('home');
        loadFeed();
});
});
document.getElementById('btn-logout').addEventListener('click',() => {
        localStorage.removeItem('lurkforwork_token');
        localStorage.removeItem('lurkforwork_userID');
        showPage('login');
});
const showPage = (pageName) => {
    const pages = document.querySelectorAll('.page');
        for(const page of pages) {
            page.classList.add('hide');
        }
        document.getElementById(`page-${pageName}`).classList.remove('hide');
}

let isLoading = false;
let currentStart = 0;
const loadFeed = (reset = false) => {
    if (isLoading) return;
    isLoading = true;
    document.getElementById('loading').textContent = 'Loading more jobs...';
    document.getElementById('loading').style.display = 'block';
    apiCall(`job/feed?start=${currentStart}`,'GET', null,{
        'Content-type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('lurkforwork_token')}`
    },function(data){
        isLoading = false;
        document.getElementById('loading').style.display = 'none';
        console.log(data);
        const feedContainer = document.getElementById('feed-content');
        console.log(feedContainer.children.length);
        if (reset) {
            feedContainer.innerHTML = '';
        }
        if (!data || data.length === 0) {
            document.getElementById('nomoreJobs').style.display = 'block';
            return;
        }else{
            document.getElementById('nomoreJobs').style.display = 'none';
        }
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        data.forEach(job => {
            const jobCard = createJobCard(job);
            feedContainer.appendChild(jobCard);
            viewLiker(jobCard,job);
            viewComment(jobCard,job);
            setupLikeButton(job, jobCard);
        });
        currentStart += data.length;
    }); 
};

function createJobCard(job){
    const currentUserId = localStorage.getItem('lurkforwork_userID');
    const jobCard = document.createElement('div');
    const isLiked = job.likes[currentUserId];
    console.log(isLiked);
    jobCard.className = 'card';
    jobCard.innerHTML = `
        ${job.image ? `<img src="${job.image}" class="card-img-top" alt="Job image">` : ''}
        <div class="card-body ">
            <h5 class="card-title">${job.title}</h5>
            <p class="card-text"><strong>Starting Date:</strong> ${formatStartDate(job.start)}</p>
                <div class="like me-2">
                    <button id="like" class="btn btn-sm btn-outline-primary">
                    Like
                    </button>
                    <span class="ms-1 likelength">${job.likes.length}</span>
                </div>
                <button class="btn btn-link btn-sm view-likers" data-job-id="${job.id}">
                    View ${job.likes.length} ${job.likes.length === 1 ? 'like' : 'likes'}
                </button>
            <p class="card-text job-description">${job.description}</p>
            <div class="d-flex justify-content-between align-items-center">
                <button class="btn btn-sm btn-outline-secondary view-comments">
                    View ${job.comments.length} ${job.comments.length === 1 ? 'comment' : 'comments'}
                </button>
            </div>
        </div>
        <div class="card-footer">
            <div class="d-flex justify-content-between align-items-center">
                <span class="fw-bold">Posted by: User ${job.userId}</span>
                <span class="text-muted">${formatTimestamp(job.createdAt)}</span>
            </div>
        </div>`;
        return jobCard;
}

function viewLiker(jobCard,job){
    jobCard.querySelector('.view-likers').addEventListener('click', () => {
        const likeinside = document.getElementById('likeinside');
        const likepeople = document.getElementById('likepeople');
        likepeople.innerHTML='';
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
                 //showProfile(userid);
            });
        listlikePeople.appendChild(userNameElement);
        });
        likepeople.appendChild(listlikePeople);
    });
}

function viewComment(jobCard,job){
    jobCard.querySelector('.view-comments').addEventListener('click', () => {
        const commentinside = document.getElementById('commentinside');
        const commentcontent = document.getElementById('commentcontent');
        commentcontent.innerHTML='';
        commentinside.style.display = 'flex';
        document.getElementById('closeComment').addEventListener('click',() => {
            commentinside.style.display = 'none';
        }
        );
        if(job.comments.length===0){
            commentcontent.innerHTML = `<p class="text-center my-3">No comments yet</p>`;
            return;
        }
        const listComments = document.createElement('div');
        listComments.className = 'list-group list-group-flush';
        job.comments.forEach(user => {
            const commentElement = document.createElement('div');
            commentElement.className= 'list-group-item list-group-item-action';
            commentElement.innerHTML=
            `<div class="d-flex justify-content-between align-items-center">
            <a href="#" class="userNameElement active">${user.userName || `User ${user.userId}`}</a>
            <p class="mb-1">${user.comment}</p>
            </div>`;
            commentElement.querySelector('.userNameElement').addEventListener('click', ()=>{
                commentinside.style.display = 'none';
                 //showProfile(userid);
            });
        listComments.appendChild(commentElement);
        });
        commentcontent.appendChild(listComments);
    });
}


function setupLikeButton(job, jobCard) {
    const currentUserId = localStorage.getItem('lurkforwork_userID');
    const likeButton = jobCard.querySelector('#like');
    const likeCountElement = jobCard.querySelector('.likelength');
    const viewLikersButton = jobCard.querySelector('.view-likers');
    
    likeButton.addEventListener('click', () => {
        const isLiked = job.likes[currentUserId];
        apiCall('job/like', 'PUT', JSON.stringify({
            id: job.id,
            turnon: !isLiked
        }), {
            'Content-type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('lurkforwork_token')}`
        }, function(data) {
            if (!isLiked) {
                job.likes[currentUserId]=true;
            } else {
                delete job.likes[currentUserId];
            }
            //updateLikeButtonState(job, currentUserId, likeButton);
            const newLikeCount = job.likes.length;
            likeCountElement.textContent = newLikeCount;
            viewLikersButton.textContent = `View ${newLikeCount} ${newLikeCount === 1 ? 'like' : 'likes'}`;
        });
    });
}

/*function updateLikeButtonState(job,currentUserId,likeButton) {
    const isLiked = job.likes[currentUserId];
    likeButton.className = 'btn btn-sm';
    likeButton.textContent = isLiked ? 'Unlike' : 'Like';
    likeButton.classList.add(isLiked ? 'btn-primary' : 'btn-outline-primary');
}*/



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


window.addEventListener('scroll', () => {
    if (isLoading || document.getElementById('loading').style.display === 'flex') return;
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        loadFeed();
    }
});


let token = localStorage.getItem('lurkforwork_token');
if(token){
    showPage('home');
    loadFeed();
}else{
    showPage('login');
}
