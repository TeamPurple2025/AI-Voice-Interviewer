// Candidate details from form or URL
let candidateName = '';
let candidateEmail = '';
let candidatePhone = '';
let resumeFile = null;

// Questions
const questions = [
  "Tell me about yourself",
  "Explain your educational background",
  "What are your weaknesses and strengths?",
  "Describe your experience with object-oriented programming",
  "How would you optimize low-performing SQL code?",
  "Explain the purpose of a firewall",
  "How do you approach troubleshooting a crashing program?",
  "Explain SDLC and its uses",
  "Explain the concept of horizontal scaling and its benefits",
  "Why should I hire you?"
];

let currentQuestionIndex = 0;
let mediaRecorder;
let recordedChunks = [];

// Elements
const questionElement = document.getElementById('question');
const timerElement = document.getElementById('timer');
const nextBtn = document.getElementById('nextBtn');
const summaryContainer = document.getElementById('summary');
const videoPreview = document.getElementById('videoPreview');

// Timer function
let countdown;
function startTimer(seconds, callback) {
  clearInterval(countdown);
  let timeLeft = seconds;
  timerElement.textContent = `⏱ ${timeLeft}s`;
  countdown = setInterval(() => {
    timeLeft--;
    timerElement.textContent = `⏱ ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(countdown);
      callback();
    }
  }, 1000);
}

// Speak with text-to-speech
function speak(text) {
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = 'en-US';
  speechSynthesis.speak(msg);
}

// Show next question
function showQuestion() {
  if (currentQuestionIndex >= questions.length) {
    finishInterview();
    return;
  }
  const q = questions[currentQuestionIndex];
  questionElement.textContent = `Q${currentQuestionIndex + 1}: ${q}`;
  speak(q);
  startTimer(300, () => {
    currentQuestionIndex++;
    showQuestion();
  });
}

// Finish
function finishInterview() {
  clearInterval(countdown);
  stopRecording();
  questionElement.textContent = "✅ Interview Completed. Thank you!";
  timerElement.style.display = "none";
  nextBtn.style.display = "none";
  summaryContainer.innerHTML = questions.map((q, i) => `<p><b>Q${i + 1}:</b> ${q}</p>`).join('');
}

// Recording
async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  videoPreview.srcObject = stream;
  videoPreview.play();
  recordedChunks = [];
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = event => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = async () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const file = new File([blob], `${candidateName}-interview.webm`, { type: 'video/webm' });
    uploadToDrive(file);
  };

  mediaRecorder.start();
}

// Stop
function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
}

// Google Drive Upload
function uploadToDrive(file) {
  const form = new FormData();
  form.append("file", file);
  fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: "POST",
    headers: new Headers({
      "Authorization": `Bearer ${gapi.auth.getToken().access_token}`,
    }),
    body: form
  }).then(res => res.json()).then(data => {
    alert("🎉 Interview uploaded successfully!");
  }).catch(err => {
    console.error(err);
    alert("❌ Upload failed");
  });
}

// Start flow
function startInterview() {
  speak(`Hello ${candidateName}, I am Team Purple AI Interviewer. We are sorry for the inconvenience caused by taking re-interviews due to an emergency. Let's start the interview.`);
  setTimeout(() => {
    showQuestion();
  }, 4000);
  startRecording();
}

// Handle form submit
function handleFormSubmit() {
  const urlParams = new URLSearchParams(window.location.search);
  candidateName = urlParams.get("name") || "Candidate";
  candidateEmail = urlParams.get("email") || "";
  candidatePhone = urlParams.get("phone") || "";
  resumeFile = document.getElementById("resumeUpload")?.files[0] || null;

  document.getElementById("instructionsScreen").style.display = "none";
  document.getElementById("interviewScreen").style.display = "block";

  let count = 3;
  timerElement.textContent = `Interview starts in ${count}...`;
  const countdownInterval = setInterval(() => {
    count--;
    if (count > 0) {
      timerElement.textContent = `Interview starts in ${count}...`;
    } else {
      clearInterval(countdownInterval);
      startInterview();
    }
  }, 1000);
}

// Google API Load
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

function initClient() {
  gapi.client.init({
    apiKey: '',
    clientId: '866301552913-3qh9qa7n2akv7utb0jqj2flppppilqln.apps.googleusercontent.com',
    scope: 'https://www.googleapis.com/auth/drive.file',
    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"]
  }).then(() => {
    return gapi.auth2.getAuthInstance().signIn();
  });
}

window.onload = handleClientLoad;
