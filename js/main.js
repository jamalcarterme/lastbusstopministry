// Last Bus Stop Ministry - Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
  // Mobile Menu Toggle
  const mobileMenuButton = document.getElementById('mobileMenuButton');
  const mobileMenu = document.getElementById('mobileMenu');
  
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', function() {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // Authentication Modal
  const loginBtn = document.getElementById('loginBtn');
  const mobileLoginBtn = document.getElementById('mobileLoginBtn');
  const authModal = document.getElementById('authModal');
  const closeModal = document.getElementById('closeModal');
  const showRegister = document.getElementById('showRegister');
  const showLogin = document.getElementById('showLogin');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  function openModal() {
    authModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }

  function closeModalFunc() {
    authModal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  if (loginBtn) loginBtn.addEventListener('click', openModal);
  if (mobileLoginBtn) mobileLoginBtn.addEventListener('click', openModal);
  if (closeModal) closeModal.addEventListener('click', closeModalFunc);
  
  // Close modal when clicking outside
  authModal.addEventListener('click', function(e) {
    if (e.target === authModal) {
      closeModalFunc();
    }
  });

  // Switch between login and register forms
  if (showRegister) {
    showRegister.addEventListener('click', function(e) {
      e.preventDefault();
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
    });
  }

  if (showLogin) {
    showLogin.addEventListener('click', function(e) {
      e.preventDefault();
      registerForm.classList.add('hidden');
      loginForm.classList.remove('hidden');
    });
  }

  // Slide-in animations
  const slideInElements = document.querySelectorAll('.slide-in');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.1
  });

  slideInElements.forEach(element => {
    observer.observe(element);
  });

  // Testimonials Slider
  const testimonialSlides = document.getElementById('testimonialSlides');
  const prevTestimonial = document.getElementById('prevTestimonial');
  const nextTestimonial = document.getElementById('nextTestimonial');
  const testimonialIndicators = document.getElementById('testimonialIndicators');
  
  const testimonials = [
    {
      name: "Adeola Adeyemi",
      role: "Mother & Business Owner",
      text: "Last Bus Stop Ministry has transformed my family. The teachings have brought healing and prosperity into our home."
    },
    {
      name: "Chinedu Okafor",
      role: "University Student",
      text: "I found purpose and direction here. The youth fellowship has been a strong support system for me in school."
    },
    {
      name: "Grace Johnson",
      role: "Retired Teacher",
      text: "After years of searching, I've finally found a church that feeds my soul. The worship is powerful and authentic."
    }
  ];

  // Create testimonial slides
  testimonials.forEach((testimonial, index) => {
    const slide = document.createElement('div');
    slide.className = 'min-w-full px-4';
    slide.innerHTML = `
      <div class="bg-white bg-opacity-10 p-8 rounded-lg text-center">
        <p class="text-lg mb-6 italic">\"${testimonial.text}\"</p>
        <h4 class="font-bold text-secondary">${testimonial.name}</h4>
        <p class="text-sm text-gray-300">${testimonial.role}</p>
      </div>
    `;
    testimonialSlides.appendChild(slide);

    // Create indicator
    const indicator = document.createElement('button');
    indicator.className = `w-3 h-3 rounded-full transition-all ${index === 0 ? 'bg-secondary' : 'bg-white bg-opacity-50'}`;
    indicator.dataset.index = index;
    indicator.addEventListener('click', () => goToTestimonial(index));
    testimonialIndicators.appendChild(indicator);
  });

  let currentTestimonial = 0;
  const totalTestimonials = testimonials.length;

  function updateTestimonialSlider() {
    testimonialSlides.style.transform = `translateX(-${currentTestimonial * 100}%)`;
    
    // Update indicators
    document.querySelectorAll('#testimonialIndicators button').forEach((btn, index) => {
      if (index === currentTestimonial) {
        btn.classList.remove('bg-white', 'bg-opacity-50');
        btn.classList.add('bg-secondary');
      } else {
        btn.classList.remove('bg-secondary');
        btn.classList.add('bg-white', 'bg-opacity-50');
      }
    });
  }

  function goToTestimonial(index) {
    currentTestimonial = index;
    updateTestimonialSlider();
  }

  function nextTestimonialFunc() {
    currentTestimonial = (currentTestimonial + 1) % totalTestimonials;
    updateTestimonialSlider();
  }

  function prevTestimonialFunc() {
    currentTestimonial = (currentTestimonial - 1 + totalTestimonials) % totalTestimonials;
    updateTestimonialSlider();
  }

  if (nextTestimonial) {
    nextTestimonial.addEventListener('click', nextTestimonialFunc);
  }

  if (prevTestimonial) {
    prevTestimonial.addEventListener('click', prevTestimonialFunc);
  }

  // Auto-advance testimonials
  let testimonialInterval = setInterval(nextTestimonialFunc, 5000);

  // Pause auto-advance when hovering over slider
  if (document.querySelector('.testimonials')) {
    document.querySelector('.testimonials').addEventListener('mouseenter', () => {
      clearInterval(testimonialInterval);
    });
    
    document.querySelector('.testimonials').addEventListener('mouseleave', () => {
      testimonialInterval = setInterval(nextTestimonialFunc, 5000);
    });
  }

  // Events Data
  const events = [
    {
      title: "Sunday Worship Service",
      date: "Every Sunday",
      time: "9:00 AM - 12:00 PM",
      location: "Main Sanctuary",
      description: "Experience powerful worship and life-changing messages from God's Word."
    },
    {
      title: "Midweek Prayer Meeting",
      date: "Every Wednesday",
      time: "6:00 PM - 8:00 PM",
      location: "Prayer Hall",
      description: "Join us for fervent prayer and spiritual breakthrough."
    },
    {
      title: "Youth Fellowship Night",
      date: "Every Friday",
      time: "7:00 PM - 9:00 PM",
      location: "Youth Center",
      description: "Dynamic programs for young people to grow in faith and fellowship."
    },
    {
      title: "Women's Ministry Conference",
      date: "June 15-16, 2025",
      time: "9:00 AM - 5:00 PM",
      location: "Main Sanctuary",
      description: "Empowering women of God for greater impact in their homes and communities."
    }
  ];

  // Announcements Data
  const announcements = [
    "New members' class starts next Sunday at 1:00 PM.",
    "Prayer partners needed for our monthly fasting program.",
    "Children's Church is now offering online registration.",
    "Church office will be closed on Monday for public holiday."
  ];

  // Blog Posts Data
  const blogPosts = [
    {
      title: "The Power of Persistent Prayer",
      excerpt: "Discover how consistent prayer can transform your spiritual life and bring breakthrough in difficult situations.",
      date: "May 15, 2025",
      author: "Pastor Chinyere Ameachi",
      image: "/assets/images/blog/prayer.jpg"
    },
    {
      title: "Raising Godly Children in Modern Nigeria",
      excerpt: "Practical biblical wisdom for parents navigating the challenges of raising children in today's world.",
      date: "May 8, 2025",
      author: "Evangelist Solomon Amaechi",
      image: "/assets/images/blog/children.jpg"
    },
    {
      title: "The Holy Spirit and Spiritual Gifts",
      excerpt: "Understanding the manifestations of the Holy Spirit and how to operate in your spiritual gifts.",
      date: "May 1, 2025",
      author: "Pastor Chinyere Amaechi",
      image: "/assets/images/blog/spirit.jpg"
    }
  ];

  // Populate Events
  const eventsContainer = document.getElementById('eventsContainer');
  if (eventsContainer) {
    events.forEach(event => {
      const eventElement = document.createElement('div');
      eventElement.className = 'bg-white p-6 rounded-lg shadow-md hover-scale';
      eventElement.innerHTML = `
        <div class="flex justify-between items-start mb-2">
          <h3 class="text-xl font-bold text-primary">${event.title}</h3>
          <span class="bg-secondary text-primary px-3 py-1 rounded-full text-sm font-semibold">${event.date}</span>
        </div>
        <p class="text-gray-600 mb-2"><strong>Time:</strong> ${event.time}</p>
        <p class="text-gray-600 mb-2"><strong>Location:</strong> ${event.location}</p>
        <p class="text-gray-700">${event.description}</p>
      `;
      eventsContainer.appendChild(eventElement);
    });
  }

  // Populate Announcements
  const announcementsContainer = document.getElementById('announcementsContainer');
  if (announcementsContainer) {
    const ul = document.createElement('ul');
    announcements.forEach(announcement => {
      const li = document.createElement('li');
      li.className = 'flex items-start mb-3 last:mb-0';
      li.innerHTML = `<span class="text-secondary mr-2">•</span> <span>${announcement}</span>`;
      ul.appendChild(li);
    });
    announcementsContainer.appendChild(ul);
  }

  // Populate Blog Posts
  const blogPostsContainer = document.getElementById('blogPostsContainer');
  if (blogPostsContainer) {
    blogPosts.forEach(post => {
      const blogElement = document.createElement('div');
      blogElement.className = 'bg-white rounded-lg overflow-hidden shadow-md hover-scale';
      blogElement.innerHTML = `
        <img src="${post.image}" alt="${post.title}" class="w-full h-48 object-cover">
        <div class="p-6">
          <p class="text-secondary text-sm font-semibold">${post.date} • By ${post.author}</p>
          <h3 class="text-xl font-bold text-primary mt-2 mb-3">${post.title}</h3>
          <p class="text-gray-700 mb-4">${post.excerpt}</p>
          <a href="pages/blog-post.html" class="text-secondary font-semibold hover:underline">Read More →</a>
        </div>
      `;
      blogPostsContainer.appendChild(blogElement);
    });
  }

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        window.scrollTo({
          top: target.offsetTop - 100,
          behavior: 'smooth'
        });
      }
    });
  });
});