import { db } from '../../config/firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const QUESTION_BANK = {
    coding: [
        { q: "What does HTML stand for?", options: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlinks Text Mark Language"], correct: 0 },
        { q: "Which CSS property changes text color?", options: ["font-color", "text-color", "color", "text-style"], correct: 2 },
        { q: "Which tag is used for a hyperlink in HTML?", options: ["<link>", "<a>", "<href>", "<url>"], correct: 1 },
        { q: "What does CSS stand for?", options: ["Computer Style Sheets", "Cascading Style Sheets", "Creative Style System", "Colorful Style Sheets"], correct: 1 },
        { q: "Which HTML tag creates a paragraph?", options: ["<para>", "<p>", "<text>", "<paragraph>"], correct: 1 },
        { q: "Which HTML tag is used for the largest heading?", options: ["<h6>", "<h1>", "<head>", "<heading>"], correct: 1 },
        { q: "What is the correct syntax to print 'Hello' in Python?", options: ["print('Hello')", "echo 'Hello'", "console.log('Hello')", "printf('Hello')"], correct: 0 },
        { q: "Which of the following is a Python data type?", options: ["String", "Integer", "Float", "All of the above"], correct: 3 },
        { q: "Which symbol is used for single-line comments in Python?", options: ["//", "#", "/* */", "--"], correct: 1 },
        { q: "What is the output of 2 + 3 * 4?", options: ["20", "14", "24", "10"], correct: 1 },
        { q: "Which keyword defines a function in Python?", options: ["function", "def", "func", "define"], correct: 1 },
        { q: "Which is NOT a Python loop?", options: ["for", "while", "do-while", "None of the above"], correct: 2 },
        { q: "Which data structure uses key-value pairs in Python?", options: ["List", "Tuple", "Dictionary", "Set"], correct: 2 },
        { q: "What is the output of len('Hello')?", options: ["4", "5", "6", "Error"], correct: 1 },
        { q: "Which operator checks equality in Python?", options: ["=", "==", "===", "!="], correct: 1 },
        { q: "Which of these is mutable in Python?", options: ["Tuple", "String", "List", "Integer"], correct: 2 },
        { q: "Which method adds an item to a Python list?", options: ["add()", "append()", "push()", "insert()"], correct: 1 },
        { q: "What does JS stand for?", options: ["Java Source", "JavaScript", "Java Standard", "Just Script"], correct: 1 },
        { q: "Which keyword declares a variable in modern JavaScript?", options: ["var only", "let and const", "dim", "int"], correct: 1 },
        { q: "What is 10 % 3 in Python?", options: ["3", "1", "0", "3.33"], correct: 1 },
        { q: "Which of these is a Python web framework?", options: ["Django", "Laravel", "React", "Angular"], correct: 0 },
        { q: "What is the correct file extension for Python files?", options: [".py", ".python", ".pt", ".p"], correct: 0 },
        { q: "Which symbol is used for exponent in Python?", options: ["^", "**", "^^", "exp"], correct: 1 },
        { q: "What is the output of bool(0)?", options: ["True", "False", "0", "Error"], correct: 1 },
        { q: "Which tag is used for images in HTML?", options: ["<image>", "<img>", "<picture>", "<src>"], correct: 1 },
        { q: "Which method converts a string to integer in Python?", options: ["str()", "int()", "float()", "convert()"], correct: 1 },
        { q: "What is the default port for HTTP?", options: ["21", "80", "443", "8080"], correct: 1 },
        { q: "Which of these is NOT a Python keyword?", options: ["def", "class", "main", "lambda"], correct: 2 },
        { q: "What does 'pip' stand for in Python?", options: ["Python Install Package", "Pip Installs Packages", "Python Index Program", "Package Installer Python"], correct: 1 },
        { q: "Which function gets user input in Python 3?", options: ["input()", "raw_input()", "read()", "scan()"], correct: 0 },
        { q: "Which CSS property adds space inside an element?", options: ["margin", "padding", "border", "gap"], correct: 1 },
        { q: "What is the output of type(5.0) in Python?", options: ["<class 'int'>", "<class 'float'>", "<class 'double'>", "<class 'decimal'>"], correct: 1 },
        { q: "Which Python library is used for data analysis?", options: ["pandas", "requests", "flask", "django"], correct: 0 },
        { q: "What is a correct way to write a comment in CSS?", options: ["// comment", "/* comment */", "# comment", "<!-- comment -->"], correct: 1 },
        { q: "Which method removes the last item from a Python list?", options: ["delete()", "remove()", "pop()", "clear()"], correct: 2 },
        { q: "Which of these is NOT a JavaScript data type?", options: ["number", "string", "boolean", "character"], correct: 3 },
        { q: "Which keyword is used for inheritance in Python?", options: ["inherits", "extends", "class Child(Parent)", "super"], correct: 2 },
        { q: "Which git command initializes a new repository?", options: ["git start", "git init", "git new", "git create"], correct: 1 },
        { q: "What does API stand for?", options: ["Application Programming Interface", "Applied Program Integration", "Advanced Programming Interface", "Application Process Interface"], correct: 0 },
        { q: "Which Python library is used to make HTTP requests?", options: ["requests", "http", "urllib3 only", "fetch"], correct: 0 },
        { q: "What does JSON stand for?", options: ["Java Standard Object Notation", "JavaScript Object Notation", "Java Script Oriented Node", "Java Serialized Object Notation"], correct: 1 },
        { q: "Which HTML attribute specifies an image source?", options: ["href", "src", "link", "source"], correct: 1 },
        { q: "What is the output of 'Hello'[1] in Python?", options: ["H", "e", "l", "o"], correct: 1 },
        { q: "Which of these is a valid Python variable name?", options: ["2name", "my-name", "my_name", "my name"], correct: 2 },
        { q: "What does 'null' mean in JavaScript?", options: ["Undefined value", "Empty string", "Intentionally empty value", "Zero"], correct: 2 },
        { q: "Which Python keyword handles exceptions?", options: ["catch", "except", "try-catch", "handle"], correct: 1 },
        { q: "What is the correct way to write a list in Python?", options: ["(1, 2, 3)", "[1, 2, 3]", "{1, 2, 3}", "<1, 2, 3>"], correct: 1 },
        { q: "Which CSS property makes text bold?", options: ["font-weight: bold", "text-weight: bold", "font-style: bold", "bold: true"], correct: 0 },
        { q: "Which symbol is used for string formatting in Python 3.6+?", options: ["%", "f-string", "format()", "All of the above"], correct: 3 },
        { q: "What is Python primarily?", options: ["Compiled language", "Interpreted language", "Assembly language", "Machine language"], correct: 1 }
    ],
    ai: [
        { q: "What does AI stand for?", options: ["Automated Intelligence", "Artificial Intelligence", "Advanced Integration", "Auto Interface"], correct: 1 },
        { q: "Which of these is a popular AI model?", options: ["ChatGPT", "PhotoShop", "Excel", "Word"], correct: 0 },
        { q: "What does ML stand for?", options: ["Machine Language", "Machine Learning", "Model Logic", "Multi Layer"], correct: 1 },
        { q: "Which Python library is used for ML?", options: ["scikit-learn", "numpy", "pandas", "All of the above"], correct: 3 },
        { q: "What is a Neural Network?", options: ["A computer cable", "A brain-inspired model", "A type of database", "A programming language"], correct: 1 },
        { q: "Which of these is supervised learning?", options: ["Clustering", "Classification", "Dimensionality Reduction", "None"], correct: 1 },
        { q: "What does NLP stand for?", options: ["Natural Language Processing", "New Language Program", "Network Layer Protocol", "Neural Logic Program"], correct: 0 },
        { q: "Which company created ChatGPT?", options: ["Google", "Microsoft", "OpenAI", "Meta"], correct: 2 },
        { q: "What is training data?", options: ["Data used to test models", "Data used to teach models", "Random numbers", "Encrypted data"], correct: 1 },
        { q: "What is a prompt?", options: ["A type of error", "Input given to AI", "Output from AI", "A computer screen"], correct: 1 },
        { q: "Which is NOT a type of Machine Learning?", options: ["Supervised", "Unsupervised", "Reinforcement", "Linear"], correct: 3 },
        { q: "What is overfitting?", options: ["Model too simple", "Model memorizes training data", "Model too fast", "Model too small"], correct: 1 },
        { q: "What is a dataset?", options: ["Collection of data", "A database", "A model", "A language"], correct: 0 },
        { q: "Which is a popular AI framework?", options: ["TensorFlow", "React", "Laravel", "Django"], correct: 0 },
        { q: "What is a chatbot?", options: ["A boat", "Program that chats with users", "A game", "A device"], correct: 1 },
        { q: "What is deep learning?", options: ["Learning deep topics", "ML with neural networks", "Learning to swim", "Advanced SQL"], correct: 1 },
        { q: "What is an algorithm?", options: ["Step-by-step procedure", "A computer part", "A language", "A file type"], correct: 0 },
        { q: "What does GPT stand for?", options: ["General Purpose Tool", "Generative Pre-trained Transformer", "Great Programming Tool", "Generative Program Type"], correct: 1 },
        { q: "Which neural network is used for image recognition?", options: ["CNN", "RNN", "SQL", "HTTP"], correct: 0 },
        { q: "What is a feature in ML?", options: ["A characteristic of data", "A bug", "A database", "A type of AI"], correct: 0 },
        { q: "What is accuracy in ML?", options: ["Model speed", "Correct predictions ratio", "Data size", "Training time"], correct: 1 },
        { q: "What is regression?", options: ["Predicting continuous values", "Classifying categories", "Clustering data", "Reducing data"], correct: 0 },
        { q: "What is classification?", options: ["Predicting categories", "Predicting numbers", "Cleaning data", "Copying data"], correct: 0 },
        { q: "What is TensorFlow?", options: ["A database", "An ML library", "A language", "A processor"], correct: 1 },
        { q: "What is unsupervised learning?", options: ["With labels", "Without labels", "Only supervised", "Only reinforcement"], correct: 1 },
        { q: "Why is GPU used in AI?", options: ["Speed up computations", "Store files", "Print images", "Send emails"], correct: 0 },
        { q: "What is tokenization in NLP?", options: ["Breaking text into tokens", "Encrypting text", "Translating text", "Deleting text"], correct: 0 },
        { q: "What is a neural network layer?", options: ["Floor of building", "Level of neurons", "A type of cable", "A database row"], correct: 1 },
        { q: "What is reinforcement learning?", options: ["Learning from rewards", "Learning from labels", "Learning from clusters", "No learning"], correct: 0 },
        { q: "What is a model in AI?", options: ["A math function", "A drawing", "A photo", "A toy"], correct: 0 },
        { q: "What is bias in AI?", options: ["Unfair results", "Hardware error", "Software bug", "Data size"], correct: 0 },
        { q: "What is a confusion matrix?", options: ["Error table", "A puzzle", "A matrix of numbers", "A design pattern"], correct: 0 },
        { q: "Which Python library visualizes data?", options: ["matplotlib", "requests", "flask", "pillow"], correct: 0 },
        { q: "What is a hyperparameter?", options: ["Setting of model", "Data value", "Model output", "Error"], correct: 0 },
        { q: "What does LLM stand for?", options: ["Large Language Model", "Long Logical Memory", "Low Level Machine", "Linear Logic Model"], correct: 0 },
        { q: "What is cosine similarity used for?", options: ["Text comparison", "Database query", "File compression", "Encryption"], correct: 0 },
        { q: "What is an epoch in ML?", options: ["A full training cycle", "A type of data", "A model", "A library"], correct: 0 },
        { q: "What is batch size?", options: ["Data processed together", "Model size", "File size", "Image size"], correct: 0 },
        { q: "Which activation function is popular in neural networks?", options: ["ReLU", "SQL", "HTTP", "TCP"], correct: 0 },
        { q: "What is an embedding?", options: ["Vector representation", "A bug", "A file", "A loop"], correct: 0 },
        { q: "What is the purpose of an API?", options: ["Connect applications", "Store data", "Print files", "Clean code"], correct: 0 },
        { q: "What is transfer learning?", options: ["Reusing trained models", "Copying data", "Deleting models", "Random training"], correct: 0 },
        { q: "What is AI ethics?", options: ["Fair use of AI", "AI speed", "AI size", "AI cost"], correct: 0 },
        { q: "What is generative AI?", options: ["Creates new content", "Only classifies", "Only predicts", "Only stores"], correct: 0 },
        { q: "What is a vector in AI?", options: ["List of numbers", "A type of car", "A photo", "A sound"], correct: 0 },
        { q: "What is a corpus in NLP?", options: ["Large text collection", "A model", "A library", "A bug"], correct: 0 },
        { q: "What is sentiment analysis?", options: ["Detecting emotions in text", "Translating text", "Summarizing text", "Encrypting text"], correct: 0 },
        { q: "What is inference in AI?", options: ["Making predictions", "Training model", "Cleaning data", "Deleting files"], correct: 0 },
        { q: "Which is NOT an AI application?", options: ["Self-driving cars", "Voice assistants", "Image recognition", "Simple calculator"], correct: 3 },
        { q: "What is fine-tuning?", options: ["Further training a model", "Deleting a model", "Creating a new model", "Copying a model"], correct: 0 }
    ]
};

let currentQuestions = [];
let currentAnswers = {};
let currentSubject = '';
let studentData = {};
let timeRemaining = 1800;
let timerInterval = null;
let testStartTime = null;

const setupScreen = document.getElementById('setupScreen');
const testScreen = document.getElementById('testScreen');

document.getElementById('startBtn').addEventListener('click', () => {
    const name = document.getElementById('studentName').value.trim();
    const phone = document.getElementById('studentPhone').value.trim();
    const subject = document.getElementById('subjectSelect').value;

    if (!name || !phone || !subject) {
        alert('Please fill all fields');
        return;
    }

    if (!/^03\d{2}-?\d{7}$/.test(phone.replace(/\s/g, ''))) {
        alert('Please enter a valid WhatsApp number (e.g., 03001234567)');
        return;
    }

    studentData = { name, phone, subject };
    currentSubject = subject;
    
    const questions = [...QUESTION_BANK[subject]];
    currentQuestions = shuffleArray(questions).slice(0, 50);
    currentAnswers = {};
    
    const subjectNames = {
        coding: 'Web Development',
        ai: 'Artificial Intelligence'
    };
    document.getElementById('subjectText').textContent = subjectNames[subject];
    
    renderQuestions();
    
    setupScreen.classList.add('hidden');
    testScreen.classList.remove('hidden');
    
    testStartTime = new Date();
    startTimer();
    
    window.scrollTo(0, 0);
});

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function renderQuestions() {
    const container = document.getElementById('questionsContainer');
    container.innerHTML = currentQuestions.map((q, idx) => `
        <div class="question-card" data-qidx="${idx}">
            <div class="question-num">Question ${idx + 1} of 50</div>
            <div class="question-text">${q.q}</div>
            <div class="options">
                ${q.options.map((opt, oidx) => `
                    <label class="option" data-oidx="${oidx}">
                        <input type="radio" name="q${idx}" value="${oidx}" onchange="selectOption(${idx}, ${oidx})">
                        <span>${opt}</span>
                    </label>
                `).join('')}
            </div>
        </div>
    `).join('');
}

window.selectOption = function(qIdx, oIdx) {
    currentAnswers[qIdx] = oIdx;
    const card = document.querySelector(`[data-qidx="${qIdx}"]`);
    card.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
    card.querySelector(`[data-oidx="${oIdx}"]`).classList.add('selected');
    
    const answered = Object.keys(currentAnswers).length;
    document.getElementById('progressText').textContent = `${answered} of 50`;
};

function startTimer() {
    timerInterval = setInterval(() => {
        timeRemaining--;
        const mins = Math.floor(timeRemaining / 60);
        const secs = timeRemaining % 60;
        const timerEl = document.getElementById('timer');
        timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        
        if (timeRemaining <= 300) {
            timerEl.classList.add('warning');
        }
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            submitTest(true);
        }
    }, 1000);
}

document.getElementById('submitTestBtn').addEventListener('click', () => {
    const answered = Object.keys(currentAnswers).length;
    if (answered < 50) {
        if (!confirm(`You have answered only ${answered} out of 50 questions. Are you sure you want to submit?`)) {
            return;
        }
    }
    submitTest(false);
});

async function submitTest(autoSubmit) {
    if (timerInterval) clearInterval(timerInterval);
    
    const btn = document.getElementById('submitTestBtn');
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    const rollNumber = generateRollNumber();
    
    let score = 0;
    currentQuestions.forEach((q, idx) => {
        if (currentAnswers[idx] === q.correct) score++;
    });
    
    const percentage = Math.round((score / 50) * 100);
    const result = score >= 25 ? 'PASS' : 'FAIL';

    const submissionData = {
        rollNumber: rollNumber,
        studentName: studentData.name,
        phone: studentData.phone,
        subject: currentSubject,
        totalQuestions: 50,
        answered: Object.keys(currentAnswers).length,
        score: score,
        percentage: percentage,
        result: result,
        answers: currentAnswers,
        status: 'pending',
        attendance: 0,
        feesStatus: 'pending',
        feesPaid: 'Rs. 0',
        feesRemaining: 'Rs. 0',
        adminNotes: '',
        submittedAt: serverTimestamp(),
        autoSubmitted: autoSubmit || false
    };

    try {
        await addDoc(collection(db, 'testSubmissions'), submissionData);
        document.getElementById('rollNumberDisplay').textContent = rollNumber;
        document.getElementById('successModal').classList.add('active');
    } catch (err) {
        console.error('Submission error:', err);
        alert('Unable to submit test. Please try again or contact us on WhatsApp.');
        btn.disabled = false;
        btn.textContent = 'Submit Test';
    }
}

function generateRollNumber() {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `APEX-${year}-${random}`;
}

window.addEventListener('beforeunload', (e) => {
    if (testScreen && !testScreen.classList.contains('hidden')) {
        e.preventDefault();
        e.returnValue = '';
    }
});
