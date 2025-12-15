// Initialize Lucide Icons
lucide.createIcons();

// --- Theme Toggle Logic ---
const themeToggleBtn = document.getElementById('theme-toggle');
const themeToggleMobileBtn = document.getElementById('theme-toggle-mobile');
const htmlElement = document.documentElement;

function toggleTheme() {
    if (htmlElement.classList.contains('dark')) {
        htmlElement.classList.remove('dark');
        localStorage.theme = 'light';
    } else {
        htmlElement.classList.add('dark');
        localStorage.theme = 'dark';
    }
}

// Check Local Storage on load
if (localStorage.theme === 'light') {
    htmlElement.classList.remove('dark');
} else {
    htmlElement.classList.add('dark');
}

themeToggleBtn.addEventListener('click', toggleTheme);
themeToggleMobileBtn.addEventListener('click', toggleTheme);


// --- Mobile Menu Logic ---
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
});

// Close mobile menu when a link is clicked
document.querySelectorAll('#mobile-menu a').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
    });
});


// --- Footer Year ---
document.getElementById('year').textContent = new Date().getFullYear();


// --- Scroll Animation (Intersection Observer) ---
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.1
});

revealElements.forEach(el => revealObserver.observe(el));


// --- Projects Data & Modal Logic ---
const projectsData = {
    "1": {
        title: "Order Meal – Automation Suite",
        fullDescription: "Automated live-link validation for 500+ restaurants, implemented retry and timeout logic, and generated structured Excel reports - reducing manual checks by 70%. Built with Selenium WebDriver, Python, and Excel integration.",
        technologies: ["Selenium", "Python", "Excel Automation"],
        image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&q=80&w=800",
        githubUrl: "#"
    },
    "2": {
        title: "Flutter & React Native Printing Apps",
        fullDescription: "Developed cross-platform receipt-printing solutions for Android POS systems using JSON-based templates and printer SDK integration. Leveraged Flutter and React Native to create robust, hardware-interfacing applications.",
        technologies: ["Flutter", "React Native", "Dart", "JavaScript", "JSON SDKs"],
        image: "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=800",
        githubUrl: "#"
    },
    "3": {
        title: "CropCraft – ML Crop Recommendation",
        fullDescription: "Built and deployed a machine-learning model (≈ 85% accuracy) to suggest optimal crops and fertilizers via Flask API. Utilized Python, TensorFlow, and Flask for backend service.",
        technologies: ["Python", "TensorFlow", "Flask", "ML"],
        image: "https://images.unsplash.com/photo-1625246333195-58f2167181e3?auto=format&fit=crop&q=80&w=800",
        githubUrl: "#"
    },
    "4": {
        title: "Face Mask Detector",
        fullDescription: "Implemented a real-time face-mask detection system achieving ≈ 87% accuracy. Deployed via web interface using OpenCV and TensorFlow.",
        technologies: ["OpenCV", "TensorFlow", "Computer Vision"],
        image: "https://images.unsplash.com/photo-1587578932405-7c740a76a424?auto=format&fit=crop&q=80&w=800",
        githubUrl: "#"
    }
};

const modalOverlay = document.getElementById('modal-overlay');
const modalClose = document.getElementById('modal-close');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const modalImage = document.getElementById('modal-image');
const modalTech = document.getElementById('modal-tech');
const modalGithub = document.getElementById('modal-github');

document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        const project = projectsData[id];

        if (project) {
            modalTitle.textContent = project.title;
            modalDesc.textContent = project.fullDescription;
            modalImage.src = project.image;
            
            // Clear and populate tags
            modalTech.innerHTML = '';
            project.technologies.forEach(tech => {
                const span = document.createElement('span');
                span.className = 'px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium';
                span.textContent = tech;
                modalTech.appendChild(span);
            });

            // Show Link if exists
            if (project.githubUrl && project.githubUrl !== '#') {
                modalGithub.href = project.githubUrl;
                modalGithub.classList.remove('hidden');
            } else {
                modalGithub.classList.add('hidden');
            }

            modalOverlay.classList.remove('hidden');
            // Small timeout to allow display:flex to apply before adding opacity class for transition
            setTimeout(() => {
                modalOverlay.classList.add('open');
            }, 10);
        }
    });
});

function closeModal() {
    modalOverlay.classList.remove('open');
    setTimeout(() => {
        modalOverlay.classList.add('hidden');
    }, 300); // Match transition duration
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});


// --- Contact Form Logic ---
const contactForm = document.getElementById('contact-form');
const submitBtn = document.getElementById('submit-btn');
const originalBtnContent = submitBtn.innerHTML;

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Loading State
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Sending...';
    submitBtn.classList.add('opacity-70', 'cursor-not-allowed');

    // Simulate Network Request
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Success State
    submitBtn.innerHTML = `Sent Successfully <i data-lucide="check-circle" class="w-5 h-5 ml-2 inline"></i>`;
    submitBtn.classList.replace('bg-primary-600', 'bg-green-600');
    submitBtn.classList.replace('hover:bg-primary-700', 'hover:bg-green-700');
    lucide.createIcons(); // Re-render icons for the checkmark

    // Reset Form
    contactForm.reset();

    // Reset Button after delay
    setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnContent;
        submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
        submitBtn.classList.replace('bg-green-600', 'bg-primary-600');
        submitBtn.classList.replace('hover:bg-green-700', 'hover:bg-primary-700');
        lucide.createIcons();
    }, 3000);
});


// --- TourGuide (Driver.js) ---
const driverObj = window.driver.js.driver({
    showProgress: true,
    animate: true,
    allowClose: true,
    doneBtnText: 'Finish',
    nextBtnText: 'Next',
    prevBtnText: 'Previous',
    onDestroyStarted: () => {
        localStorage.setItem('hasSeenPortfolioTour', 'true');
        driverObj.destroy();
    },
    steps: [
        { element: '#home', popover: { title: 'Welcome!', description: 'Welcome to my portfolio. Here is a quick tour of the site.', side: 'bottom', align: 'start' } },
        { element: '#navbar', popover: { title: 'Navigation', description: 'Use this sticky bar to navigate quickly and toggle Dark Mode.', side: 'bottom' } },
        { element: '#skills', popover: { title: 'My Skills', description: 'Check out my technical proficiency in Web, Mobile, and QA.', side: 'top' } },
        { element: '#projects', popover: { title: 'Projects', description: 'Click on any project card to see more details in a popup.', side: 'top' } },
        { element: '#contact', popover: { title: 'Contact Me', description: 'Ready to work together? Send me a message here!', side: 'top' } }
    ]
});

// Check if tour has been seen
if (!localStorage.getItem('hasSeenPortfolioTour')) {
    setTimeout(() => {
        driverObj.drive();
    }, 1500);
}