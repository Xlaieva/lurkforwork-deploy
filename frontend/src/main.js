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
            localStorage.setItem('lurkforwork_userID',data.userId);
            apiCall('user/watch','PUT',JSON.stringify({
                id: data.userId,
                turnon: true
            }),{
                'Content-type': 'application/json',
                'Authorization': `Bearer ${data.token}`
            },function(){
                showPage('home');
                loadFeed();
            });
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
        //console.log(data.userId);
        localStorage.setItem('lurkforwork_token',data.token);
        localStorage.setItem('lurkforwork_userID',data.userId);
        apiCall('user/watch','PUT',JSON.stringify({
            id: data.userId,
            turnon: true
        }),{
            'Content-type': 'application/json',
            'Authorization': `Bearer ${data.token}`
        },function(){
            showPage('home');
            loadFeed();
        });
});
});
document.getElementById('btn-logout').addEventListener('click',() => {
        localStorage.removeItem('lurkforwork_token');
        localStorage.removeItem('lurkforwork_userID');
        showPage('login');
});

document.getElementById('btn-myprofile').addEventListener('click',() => {
    const existingUpdateButton = document.getElementById('updateProfileButton');
    if (existingUpdateButton) {
        existingUpdateButton.remove();
    }
    showProfile(localStorage.getItem('lurkforwork_userID'));
    //console.log(localStorage.getItem('lurkforwork_userID'));
    //updateProfile();
});

function addJob(){
    const addJobModal = document.getElementById('add-job');
    document.getElementById('btn-addJob-upload').onclick = null;
    document.getElementById('btn-addJob-upload').addEventListener('click', () => {
        const title = document.getElementById('addJob-title').value;
        const date = document.getElementById('addJob-date').value;
        const description = document.getElementById('addJob-description').value;
        const image = document.getElementById('addJob-image');
        if (!title || !date || !description) {
            showError('Please fill in all required fields');
            return;
        }
        const jobData = {
            title: title,
            start: date,
            description: description
        };
        if (image.files && image.files.length > 0) {
            fileToDataUrl(image.files[0]).then(imageData => {
                jobData.image = imageData.startsWith('data:') ? imageData : `data:${image.files[0].type};base64,${imageData}`;
                sendJobRequest(jobData);
            });
        } else {
            sendJobRequest(jobData);
        }
    });
    document.getElementById('closeAddJob').addEventListener('click', () => {
        addJobModal.style.display = 'none';
    });
}

function UpdateJob(job) {
    document.getElementById('updateJob-title').value = job.title;
    document.getElementById('updateJob-date').value = job.start.split('/').reverse().join('-');
    document.getElementById('updateJob-description').value = job.description;
    document.getElementById('updateJobPopup').style.display = 'flex';
    document.getElementById('updateJobPopup').style.justifyContent = 'center';
    document.getElementById('updateJobPopup').style.alignItems = 'center';
    document.getElementById('submitUpdateJob').onclick = function() {
        const jobData = {
            id: job.id,
            title: document.getElementById('updateJob-title').value,
            start: document.getElementById('updateJob-date').value,
            description: document.getElementById('updateJob-description').value
        };
        const image = document.getElementById('updateJob-image');
        if (image.files && image.files.length > 0) {
            fileToDataUrl(image.files[0]).then(imageData => {
                jobData.image = imageData.startsWith('data:') ? imageData : `data:${image.files[0].type};base64,${imageData}`;
                updateJob(jobData);
            });
        } else {
            updateJob(jobData);
        }
    };
}

function updateJob(jobData) {
    apiCall('job', 'PUT', JSON.stringify(jobData), {
        'Content-type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('lurkforwork_token')}`
    }, function() {
        document.getElementById('updateJobPopup').style.display = 'none';
        loadFeed(true); 
    });
}

function DeleteJob(jobId) {
    document.getElementById('deleteJobPopup').style.display = 'flex';
    document.getElementById('deleteJobPopup').style.justifyContent = 'center';
    document.getElementById('deleteJobPopup').style.alignItems = 'center';
    document.getElementById('confirmDeleteJob').onclick = function() {
        apiCall('job', 'DELETE', JSON.stringify({id: jobId}), {
            'Content-type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('lurkforwork_token')}`
        }, function() {
            document.getElementById('deleteJobPopup').style.display = 'none';
            loadFeed(true); 
        });
    };
}


document.getElementById('closeUpdateJob').addEventListener('click', () => {
    document.getElementById('updateJobPopup').style.display = 'none';
});

document.getElementById('cancelUpdateJob').addEventListener('click', () => {
    document.getElementById('updateJobPopup').style.display = 'none';
});

document.getElementById('closeDeleteJob').addEventListener('click', () => {
    document.getElementById('deleteJobPopup').style.display = 'none';
});

document.getElementById('cancelDeleteJob').addEventListener('click', () => {
    document.getElementById('deleteJobPopup').style.display = 'none';
});


function sendJobRequest(data) {
    apiCall('job', 'POST', JSON.stringify(data), {
        'Content-type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('lurkforwork_token')}`
    }, function(response) {
        document.getElementById('add-job').style.display = 'none';
        document.getElementById('addJob-title').value = '';
        document.getElementById('addJob-date').value = '';
        document.getElementById('addJob-description').value = '';
        document.getElementById('addJob-image').value = '';
        loadFeed(true);
    });
}

function updateProfile(){
    const updateprofile=document.getElementById('update-profile');
    document.getElementById('btn-upload').onclick = null; 
    document.getElementById('btn-upload').addEventListener('click',() => {
        const email = document.getElementById('updateProfile-email').value;
        const name = document.getElementById('updateProfile-name').value;
        const password = document.getElementById('updateProfile-password').value;
        const image = document.getElementById('updateProfile-image');
        const updateData = {};
        updateData.id=localStorage.getItem('lurkforwork_userID');
        if (email && email.trim() !== '') updateData.email = email;
        if (name && name.trim() !== '') updateData.name = name;
        if (password && password.trim() !== '') updateData.password = password;
        if (image.files && image.files.length > 0) {
            fileToDataUrl(image.files[0]).then(imageData => {
                if (imageData.startsWith('data:')) {
                    updateData.image = imageData;
                } else {
                    updateData.image = `data:${image.files[0].type};base64,${imageData}`;
                }
                //console.log(updateData);
                sendUpdateRequest(updateData);
            });
        } else {
            sendUpdateRequest(updateData);
            //console.log(updateData);
            updateprofile.style.display = 'none';
        }
    });
}
function sendUpdateRequest(data) {
    if (Object.keys(data).length === 0) {
        //console.log('44');
        showError('No changes to update');
        return;
    }
    apiCall('user', 'PUT', JSON.stringify(data), {
        'Content-type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('lurkforwork_token')}`
        }, function(response) {      
    }); 
}

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
        //console.log(data);
        const feedContainer = document.getElementById('feed-content');
        //console.log(feedContainer.children.length);
        if (reset) {
            while (feedContainer.firstChild) {
                feedContainer.removeChild(feedContainer.firstChild);
            }
        }
        if (!data || data.length === 0) {
            document.getElementById('nomoreJobs').style.display = 'block';
            return;
        }else{
            document.getElementById('nomoreJobs').style.display = 'none';
        }
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        let row = document.createElement('div');
        row.className = 'row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4';
        feedContainer.appendChild(row);
        data.forEach(job => {
            const jobCard = createJobCard(job);
            feedContainer.appendChild(jobCard);
        });
        currentStart += data.length;
        watchPopup();

        const addJobBtn = document.getElementById('btn-addJob');
        
        addJobBtn.addEventListener('click', () => {
            document.getElementById('add-job').style.display = 'flex';
            document.getElementById('add-job').style.justifyContent = 'center';
            document.getElementById('add-job').style.alignItems = 'center';
        });
    }); 
};

function watchPopup(){
    const watchUserBtn = document.getElementById('btn-watchUser');
    watchUserBtn.addEventListener('click', () => {
        document.getElementById('watchPopup').style.display = 'flex';
        document.getElementById('watchPopup').style.justifyContent = 'center';
        document.getElementById('watchPopup').style.alignItems = 'center';
    });

    document.getElementById('closeWatchPopup').addEventListener('click', () => {
        document.getElementById('watchPopup').style.display = 'none';
    });

    document.getElementById('cancelWatch').addEventListener('click', () => {
        document.getElementById('watchPopup').style.display = 'none';
    });

    document.getElementById('submitWatch').addEventListener('click', () => {
        const email = document.getElementById('watch-email').value;
        if (email) {
            apiCall('user/watch', 'PUT', JSON.stringify({
                email: email,
                turnon: true
            }), {
                'Content-type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('lurkforwork_token')}`
            }, function() {
                document.getElementById('watchPopup').style.display = 'none';
                document.getElementById('watch-email').value = '';
                showError(`Now watching user with email: ${email}`);

            });
        }
    });
}


function createJobCard(job) {
    const currentUserId = localStorage.getItem('lurkforwork_userID');
    const jobCard = document.createElement('div');
    jobCard.className = 'card h-100 d-flex flex-column';
    const isCreator = String(job.creatorId) === String(currentUserId);
    apiCall(`user/?userId=${job.creatorId}`, 'GET', null, {
        'Content-type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('lurkforwork_token')}`
    }, function(userData) {
        const userName = userData.name;
        const likerIDs = job.likes.map(like => String(like.userId));
        const isLiked = likerIDs.includes(currentUserId);
        if (job.image) {
            const img = document.createElement('img');
            img.src = job.image;
            img.className = 'card-img-top object-fit-cover';
            img.style.height = '200px';
            img.alt = 'Job image';
            jobCard.appendChild(img);
        }
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body d-flex flex-column';
        jobCard.appendChild(cardBody);
        const title = document.createElement('h5');
        title.className = 'card-title';
        title.textContent = job.title;
        cardBody.appendChild(title);
        const startDate = document.createElement('p');
        startDate.textContent = ''; 
        const strong = document.createElement('strong');
        strong.textContent = 'Starting Date: ';
        startDate.append(strong, formatStartDate(job.start));
        cardBody.appendChild(startDate);
        const likeContainer = document.createElement('div');
        likeContainer.className = 'd-flex align-items-center mb-2';
        cardBody.appendChild(likeContainer);
        const likeBtn = document.createElement('button');
        likeBtn.id = 'like';
        likeBtn.className = `btn btn-sm ${isLiked ? 'btn-primary' : 'btn-outline-primary'} me-2`;
        if (isLiked) likeBtn.disabled = true;
        likeBtn.textContent = isLiked ? 'Liked' : 'Like';
        likeContainer.appendChild(likeBtn);
        const likeCount = document.createElement('span');
        likeCount.className = 'ms-1 likelength';
        likeCount.textContent = job.likes.length;
        likeContainer.appendChild(likeCount);
        const viewLikersBtn = document.createElement('button');
        viewLikersBtn.className = 'btn btn-link btn-sm view-likers';
        viewLikersBtn.dataset.jobId = job.id;
        viewLikersBtn.textContent = `View ${job.likes.length} ${job.likes.length === 1 ? 'like' : 'likes'}`;
        likeContainer.appendChild(viewLikersBtn);
        const description = document.createElement('p');
        description.className = 'card-text job-description flex-grow-1 mb-3';
        description.textContent = job.description;
        cardBody.appendChild(description);
        const commentsContainer = document.createElement('div');
        commentsContainer.className = 'd-flex justify-content-between align-items-center mt-auto';
        cardBody.appendChild(commentsContainer);
        const viewCommentsBtn = document.createElement('button');
        viewCommentsBtn.className = 'btn btn-sm btn-outline-secondary view-comments';
        viewCommentsBtn.textContent = `View ${job.comments.length} ${job.comments.length === 1 ? 'comment' : 'comments'}`;
        commentsContainer.appendChild(viewCommentsBtn);
        const addCommentBtn = document.createElement('button');
        addCommentBtn.className = 'btn btn-sm btn-primary post-comment';
        addCommentBtn.dataset.jobId = job.id;
        addCommentBtn.textContent = 'Add Comment';
        commentsContainer.appendChild(addCommentBtn);
        if (isCreator) {
            const creatorControls = document.createElement('div');
            creatorControls.className = 'mt-3';
            cardBody.appendChild(creatorControls);
            const updateBtn = document.createElement('button');
            updateBtn.className = 'btn btn-sm btn-warning update-job';
            updateBtn.dataset.jobId = job.id;
            updateBtn.textContent = 'Update';
            creatorControls.appendChild(updateBtn);
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-danger delete-job';
            deleteBtn.dataset.jobId = job.id;
            deleteBtn.textContent = 'Delete';
            creatorControls.appendChild(deleteBtn);
        }
        const cardFooter = document.createElement('div');
        cardFooter.className = 'card-footer bg-transparent border-top-0 mt-auto';
        jobCard.appendChild(cardFooter);
        const footerContent = document.createElement('div');
        footerContent.className = 'd-flex justify-content-between align-items-center';
        cardFooter.appendChild(footerContent);
        const postedBy = document.createElement('span');
        postedBy.className = 'fw-bold';
        const postedByText = document.createTextNode('Posted by: ');
        postedBy.appendChild(postedByText);
        const userNameLink = document.createElement('a');
        userNameLink.id = 'userNamefromJob';
        userNameLink.textContent = userName;
        postedBy.appendChild(userNameLink);
        footerContent.appendChild(postedBy);
        const timestamp = document.createElement('span');
        timestamp.className = 'text-muted';
        timestamp.textContent = formatTimestamp(job.createdAt);
        footerContent.appendChild(timestamp);
        viewLiker(jobCard, job);
        viewComment(jobCard, job);
        updateLikeButton(job, jobCard);
        userNameLink.addEventListener('click', () => {
            showProfile(job.creatorId);
        });
        if (isCreator) {
            jobCard.querySelector('.update-job').addEventListener('click', () => {
                UpdateJob(job);
            });
            jobCard.querySelector('.delete-job').addEventListener('click', () => {
                DeleteJob(job.id);
            });
        }
        jobCard.querySelector('.post-comment').addEventListener('click', () => {
            updateComment(job.id);
        });
    });
    return jobCard;
}

function updateComment(jobId) {
    document.getElementById('comment-text').value = '';
    document.getElementById('commentPostPopup').style.display = 'flex';
    document.getElementById('commentPostPopup').style.justifyContent = 'center';
    document.getElementById('commentPostPopup').style.alignItems = 'center';
    document.getElementById('closeCommentPost').addEventListener('click', () => {
        document.getElementById('commentPostPopup').style.display = 'none';
    });
    document.getElementById('cancelCommentPost').addEventListener('click', () => {
        document.getElementById('commentPostPopup').style.display = 'none';
    });
    document.getElementById('submitCommentPost').addEventListener('click', () => {
        const commentText = document.getElementById('comment-text').value;
        if (!commentText) {
            showError('Comment cannot be empty');
            return;
        }
        apiCall('job/comment', 'POST', JSON.stringify({
            id: jobId,
            comment: commentText
        }), {
            'Content-type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('lurkforwork_token')}`
        }, function() {
            document.getElementById('commentPostPopup').style.display = 'none';
        });
    });
}

function showProfile(userId) {
    const existingButtons = document.querySelectorAll('#watchButton, #updateProfileButton');
    existingButtons.forEach(button => button.remove());
    apiCall(`user/?userId=${userId}`, 'GET', null, {
        'Content-type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('lurkforwork_token')}`
    }, function(userData) {
        //console.log(userData.usersWhoWatchMeUserIds);
        //console.log(userData.image);
        if(userData.image){
            const profileImage = document.getElementById('profile-image');
            profileImage.src=userData.image;}
        else {
                document.getElementById('profile-image').style.display = 'none';
            }
        document.getElementById('profile-name').textContent = userData.name;
        document.getElementById('profile-email').textContent = userData.email;
        document.getElementById('profile-followers-count').textContent = userData.usersWhoWatchMeUserIds.length;
        const followersList = document.getElementById('profile-followers-list');
        while (followersList.firstChild) {
            followersList.removeChild(followersList.firstChild);
        }
        if (userData.usersWhoWatchMeUserIds.length === 0) {
            const noFollowersItem = document.createElement('li');
            noFollowersItem.className = 'list-group-item';
            noFollowersItem.textContent = 'No followers yet';
            followersList.appendChild(noFollowersItem);
            return;
        }
        
        const processedFollowers = new Set();
        userData.usersWhoWatchMeUserIds.forEach(follower => {
            if (!processedFollowers.has(follower)) {
                processedFollowers.add(follower);
            apiCall(`user/?userId=${follower}`, 'GET', null, {
            'Content-type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('lurkforwork_token')}`
            }, function(userData) {
                
                const followerItem = document.createElement('li');
                followerItem.className = 'list-group-item';
                const followerLink = document.createElement('a');
                followerLink.href = '#';
                followerLink.className = 'follower-link';
                followerLink.dataset.userId = follower;
                followerLink.textContent = userData.name;
                followerItem.appendChild(followerLink);
                followerLink.addEventListener('click', () => {
                    showProfile(follower);
                    });
                followersList.appendChild(followerItem);
            });
        }
        });  
        const profileJobsContainer = document.getElementById('profile-jobs');
        while (profileJobsContainer.firstChild) {
            profileJobsContainer.removeChild(profileJobsContainer.firstChild);
        }
        if(userData.jobs.length===0){
            const nomoreJobs = document.createElement('p');
            nomoreJobs.innerText="It seems no jobs here."
            profileJobsContainer.appendChild(nomoreJobs);
        }
        userData.jobs.forEach(job => {
            const jobCard = createJobCard(job);
            profileJobsContainer.appendChild(jobCard);
        });
        //console.log('showP');
        showPage('profile');
        //console.log('showPl');
        document.getElementById('btn-tomyprofile').addEventListener('click',() => {
            console.log(localStorage.getItem('lurkforwork_userID'));
            showProfile(localStorage.getItem('lurkforwork_userID'));
        });
        const existingUpdateButton = document.getElementById('updateProfileButton');
        if (existingUpdateButton) {
            existingUpdateButton.remove();
        }
        const updateProfileButton = document.createElement('button');
        const updateprofile=document.getElementById('update-profile');
        if (userId === localStorage.getItem('lurkforwork_userID')) {
            updateProfileButton.id="updateProfileButton";
            updateProfileButton.className ="button btn-primary";
            updateProfileButton.innerText="Update Profile";
            document.getElementById('page-profile').appendChild(updateProfileButton);
            updateProfileButton.addEventListener('click',() => {
                //console.log(localStorage.getItem('lurkforwork_userID'));
                updateprofile.style.display='flex';
            });
            document.getElementById('closeupdateProfile').addEventListener('click',() => {
                updateprofile.style.display = 'none';
            });
            updateProfile();
        }
        else{
            if(existingUpdateButton){
                document.getElementById('page-profile').removeChild(existingUpdateButton);
            }
            const watchButton = document.createElement('button');
            watchButton.id = "watchButton";
            watchButton.className = "button btn-primary";
            const isWatching = userData.usersWhoWatchMeUserIds.includes(localStorage.getItem('lurkforwork_userID'));
            watchButton.innerText = isWatching ? "Unwatch" : "Watch";
            
            watchButton.addEventListener('click', () => {
                apiCall('user/watch', 'PUT', JSON.stringify({
                    id: userId,
                    turnon: !isWatching
                }), {
                    'Content-type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('lurkforwork_token')}`
                }, function() {
                    showProfile(userId);
                });
            });
            document.getElementById('profile-card').appendChild(watchButton);
        }

    });
}
function viewLiker(jobCard,job) {
    jobCard.querySelector('.view-likers').addEventListener('click', () => {
        const likeinside = document.getElementById('likeinside');
        const likepeople = document.getElementById('likepeople');
        while (likepeople.firstChild) {
            likepeople.removeChild(likepeople.firstChild);
        }
        likeinside.style.display = 'flex';
        document.getElementById('closelikePeople').addEventListener('click', () => {
            likeinside.style.display = 'none';
        }); 
        if (job.likes.length === 0) {
            const noLikesText = document.createElement('p');
            noLikesText.className = 'text-center my-3';
            noLikesText.textContent = 'No likes yet';
            likepeople.appendChild(noLikesText);
            return;
        } 
        const listlikePeople = document.createElement('div');
        listlikePeople.className = 'list-group list-group-flush'; 
        job.likes.forEach(user => {
            const userNameElement = document.createElement('a');
            userNameElement.href = '#';
            userNameElement.className = 'list-group-item list-group-item-action';
            const containerDiv = document.createElement('div');
            containerDiv.className = 'd-flex justify-content-between align-items-center';
            const nameSpan = document.createElement('span');
            nameSpan.textContent = user.userName || `User ${user.userId}`;
            const idSmall = document.createElement('small');
            idSmall.className = 'text-muted';
            idSmall.textContent = `ID: ${user.userId}`;
            containerDiv.appendChild(nameSpan);
            containerDiv.appendChild(idSmall);
            userNameElement.appendChild(containerDiv);
            userNameElement.addEventListener('click', () => {
                likeinside.style.display = 'none';
                showProfile(user.userId);
            });  
            listlikePeople.appendChild(userNameElement);
        }); 
        likepeople.appendChild(listlikePeople);
    });
}

function viewComment(jobCard,job) {
    jobCard.querySelector('.view-comments').addEventListener('click', () => {
        const commentinside = document.getElementById('commentinside');
        const commentcontent = document.getElementById('commentcontent');
        while (commentcontent.firstChild) {
            commentcontent.removeChild(commentcontent.firstChild);
        }
        commentinside.style.display = 'flex';
        document.getElementById('closeComment').addEventListener('click', () => {
            commentinside.style.display = 'none';
        });
        if (job.comments.length === 0) {
            const noCommentsText = document.createElement('p');
            noCommentsText.className = 'text-center my-3';
            noCommentsText.textContent = 'No comments yet';
            commentcontent.appendChild(noCommentsText);
            return;
        }
        const listComments = document.createElement('div');
        listComments.className = 'list-group list-group-flush';
        job.comments.forEach(user => {
            const commentElement = document.createElement('div');
            commentElement.className = 'list-group-item list-group-item-action';
            const containerDiv = document.createElement('div');
            containerDiv.className = 'd-flex flex-column';
            const userLink = document.createElement('a');
            userLink.href = '#';
            userLink.className = 'userNameElement active mb-1';
            userLink.textContent = user.userName || `User ${user.userId}`;
            const commentText = document.createElement('p');
            commentText.className = 'mb-1';
            commentText.textContent = user.comment;
            userLink.addEventListener('click', (e) => {
                e.preventDefault();
                commentinside.style.display = 'none';
                showProfile(user.userId);
            });
            containerDiv.appendChild(userLink);
            containerDiv.appendChild(commentText);
            commentElement.appendChild(containerDiv);
            listComments.appendChild(commentElement);
        });
        commentcontent.appendChild(listComments);
    });
}

function updateLikeButton(job,jobCard) {
    const currentUserId = localStorage.getItem('lurkforwork_userID');
    const likeButton = jobCard.querySelector('#like');
    const likeCountElement = jobCard.querySelector('.likelength');
    const viewLikersButton = jobCard.querySelector('.view-likers');
    const likerIDs = job.likes.map(like => String(like.userId));
    const isLiked = likerIDs.includes(currentUserId);
    if (isLiked) {
        likeButton.disabled = true;
        likeButton.textContent = 'Liked';
        likeButton.classList.remove('btn-outline-primary');
        likeButton.classList.add('btn-primary');
    } else {
        likeButton.disabled = false;
        likeButton.textContent = 'Like';
        likeButton.classList.add('btn-outline-primary');
        likeButton.classList.remove('btn-primary');
    }
    likeButton.addEventListener('click', () => {
        if (job.likes[currentUserId]) {
            return;
        }
        apiCall('job/like', 'PUT', JSON.stringify({
            id: job.id,
            turnon: true
        }), {
            'Content-type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('lurkforwork_token')}`
        }, function(data) {
            console.log(data);
            //job.likes[currentUserId]=true;
            const cleanedLikes = data.likes.filter(like => 
                like && typeof like === 'object' && like.userId
            );
            job.likes = cleanedLikes;
            const newLikeCount = job.likes.length;
            console.log(job.likes);
            likeCountElement.textContent = newLikeCount;
            viewLikersButton.textContent = `View ${newLikeCount} ${newLikeCount === 1 ? 'like' : 'likes'}`;
            likeButton.disabled = true;
            likeButton.textContent = 'Liked';
            likeButton.classList.remove('btn-outline-primary');
            likeButton.classList.add('btn-primary');
            
        });
    });
}





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
    showPage(pageName);
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
    addJob();
}else{
    showPage('login');
}

