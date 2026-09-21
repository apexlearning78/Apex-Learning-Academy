const COURSES = {
    coding: {
        tag: 'Programming',
        title: 'Coding: Python + Web Development',
        subtitle: 'A complete 3-month journey from zero to job-ready. Master Python, build responsive websites, and create real projects you can showcase to employers and clients.',
        duration: '3 Months',
        level: 'Beginner to Advanced',
        fee: 'Rs. 3,000',
        theme: 'coding',
        overview: 'This comprehensive course is designed for absolute beginners who want to build a career in programming and web development. You will start with the fundamentals of Python and progress to building complete, responsive websites using HTML, CSS, and JavaScript.',
        overviewExtra: 'Every concept is taught through practical examples and real projects. By the end of this course, you will have a strong portfolio to showcase your skills.',
        learn: [
            'Python programming from absolute basics to advanced concepts',
            'Object Oriented Programming (OOP) with real-world examples',
            'HTML5 and CSS3 for modern web design',
            'JavaScript fundamentals and DOM manipulation',
            'Responsive design for mobile and desktop',
            'Git and GitHub for version control',
            'Building 3 complete real-world projects',
            'Problem solving and logical thinking'
        ],
        curriculum: [
            { title: 'Module 1 — Python Fundamentals', weeks: 'Weeks 1-3', items: ['Introduction to programming and Python setup', 'Variables, data types, and operators', 'Conditional statements and loops', 'Functions and parameters', 'Lists, tuples, dictionaries, sets', 'File handling and error handling'] },
            { title: 'Module 2 — Object Oriented Programming', weeks: 'Weeks 4-5', items: ['Classes and objects', 'Inheritance and polymorphism', 'Encapsulation and abstraction', 'Building a real OOP project'] },
            { title: 'Module 3 — Web Development', weeks: 'Weeks 6-9', items: ['HTML5 structure and semantic tags', 'CSS3 styling, flexbox, and grid', 'Responsive design and media queries', 'JavaScript fundamentals', 'DOM manipulation and events', 'Building a complete portfolio website'] },
            { title: 'Module 4 — Git, GitHub & Final Projects', weeks: 'Weeks 10-12', items: ['Git version control basics', 'GitHub repository management', 'Building a Calculator App', 'Building a To-Do List App', 'Building a Portfolio Website', 'Final project defense and certificate'] }
        ],
        projects: [
            '<strong>Calculator Application</strong> — A fully functional calculator with Python',
            '<strong>To-Do List App</strong> — Task management with file storage',
            '<strong>Personal Portfolio Website</strong> — Complete responsive website with HTML, CSS, JS',
            '<strong>Weather App</strong> — Live weather data using public APIs'
        ],
        requirements: [
            'A laptop or desktop computer (Windows, Mac, or Linux)',
            'Stable internet connection',
            'Willingness to practice daily (1-2 hours minimum)',
            'No prior programming experience needed'
        ]
    },
    ai: {
        tag: 'Artificial Intelligence',
        title: 'AI: Foundations & Machine Learning',
        subtitle: 'Learn how modern AI works — from ChatGPT and prompt engineering to building your own AI applications with Python and Machine Learning.',
        duration: '4 Months',
        level: 'Beginner to Advanced',
        fee: 'Rs. 4,000',
        theme: 'ai',
        overview: 'This course is designed for students who want to understand Artificial Intelligence from the ground up. You will learn the fundamentals of AI, how machine learning works, and how to build real AI applications using Python.',
        overviewExtra: 'By the end of this course, you will have hands-on experience with AI models, prompt engineering, and real-world AI projects.',
        learn: [
            'AI fundamentals and core concepts',
            'Python programming for AI and data science',
            'NumPy, Pandas, and data manipulation',
            'Machine Learning fundamentals',
            'Supervised and unsupervised learning',
            'ChatGPT and prompt engineering',
            'Building real AI applications',
            'Introduction to Deep Learning'
        ],
        curriculum: [
            { title: 'Module 1 — Python for AI', weeks: 'Weeks 1-4', items: ['Python basics for AI', 'NumPy for numerical computing', 'Pandas for data manipulation', 'Matplotlib and Seaborn for visualization', 'Working with real datasets'] },
            { title: 'Module 2 — AI Foundations', weeks: 'Weeks 5-8', items: ['What is AI and Machine Learning', 'Types of machine learning', 'Supervised vs unsupervised learning', 'Model training and evaluation', 'Training your first ML model'] },
            { title: 'Module 3 — Prompt Engineering & ChatGPT', weeks: 'Weeks 9-12', items: ['Understanding Large Language Models', 'Prompt engineering patterns', 'Building applications with ChatGPT API', 'Practical AI use cases', 'Real-world AI automation'] },
            { title: 'Module 4 — AI Projects', weeks: 'Weeks 13-16', items: ['Building an AI Chatbot', 'Building an Image Classifier', 'Building a Prediction Model', 'Final project defense and certificate'] }
        ],
        projects: [
            '<strong>AI Chatbot</strong> — A conversational AI using ChatGPT API',
            '<strong>Image Classifier</strong> — Machine learning model to classify images',
            '<strong>Prediction Model</strong> — Real-world prediction using ML',
            '<strong>AI Automation Tool</strong> — Automate tasks with AI'
        ],
        requirements: [
            'A laptop or desktop computer (Windows, Mac, or Linux)',
            'Stable internet connection',
            'Basic computer skills',
            'Willingness to learn mathematics (no advanced math required)',
            'No prior AI or coding experience needed'
        ]
    }
};

function getCourseFromURL() {

    const params = new URLSearchParams(window.location.search);
    let key = params.get('course');

    if (!key && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        key = hashParams.get('course');
    }

    key = (key || 'coding').toLowerCase().trim();

    if (!COURSES[key]) {
        console.warn('Invalid course key:', key, '— defaulting to coding');
        key = 'coding';
    }
    
    return key;
}

const courseKey = getCourseFromURL();
const course = COURSES[courseKey];

function loadCourse(c) {

    document.title = `${c.title} | Apex Learning Academy`;

    const heroSection = document.getElementById('courseHero');
    if (c.theme === 'ai') {
        heroSection.classList.add('ai-theme');
    } else {
        heroSection.classList.remove('ai-theme');
    }

    document.getElementById('courseTag').textContent = c.tag;
    document.getElementById('courseTitle').textContent = c.title;
    document.getElementById('courseSubtitle').textContent = c.subtitle;
    document.getElementById('courseDuration').textContent = c.duration;
    document.getElementById('courseLevel').textContent = c.level;
    document.getElementById('courseFee').textContent = c.fee;

    document.getElementById('overviewText').textContent = c.overview;
    document.getElementById('overviewExtra').textContent = c.overviewExtra;

    document.getElementById('learnList').innerHTML = c.learn.map(i => `<li>${i}</li>`).join('');

    document.getElementById('curriculumContent').innerHTML = c.curriculum.map((m, idx) => `
        <div class="module${idx === 0 ? ' open' : ''}">
            <div class="module-header" onclick="toggleModule(this)">
                ${m.title}
                <span>${m.weeks}</span>
            </div>
            <div class="module-body">
                <ul>${m.items.map(i => `<li>${i}</li>`).join('')}</ul>
            </div>
        </div>
    `).join('');

    document.getElementById('projectsList').innerHTML = c.projects.map(p => `<li>${p}</li>`).join('');

    document.getElementById('requirementsList').innerHTML = c.requirements.map(r => `<li>${r}</li>`).join('');

    const waMsg = `Assalam-o-Alaikum, I want to enroll in the ${c.title} course at Apex Learning Academy. Please guide me with the payment process.`;
    document.getElementById('whatsappLink').href = `https://wa.me/923410349929?text=${encodeURIComponent(waMsg)}`;
}

loadCourse(course);

function toggleModule(header) {
    header.parentElement.classList.toggle('open');
}

function switchTab(e, tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    e.target.classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

function openPaymentModal() {
    document.getElementById('paymentModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
    document.body.style.overflow = '';
}
document.getElementById('paymentModal').addEventListener('click', (e) => {
    if (e.target.id === 'paymentModal') closePaymentModal();
});

function toggleDropdown() {
    document.getElementById('moreDropdown').classList.toggle('open');
}
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('moreDropdown');
    if (dropdown && !dropdown.contains(e.target)) dropdown.classList.remove('open');
});
function toggleMobileMenu() {
    document.getElementById('mobileMenu').classList.toggle('open');
}
document.querySelectorAll('.mobile-menu a').forEach(link => {
    link.addEventListener('click', () => {
        document.getElementById('mobileMenu').classList.remove('open');
    });
});
