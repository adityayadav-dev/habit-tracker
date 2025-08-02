
// Use a self-invoking function to avoid global scope pollution
(function() {
    // --- UI Elements ---
    const loaderWrapper = document.getElementById('loader-wrapper');
    const appContainer = document.getElementById('app');
    const habitList = document.getElementById('habit-list');
    const addHabitForm = document.getElementById('add-habit-form');
    const newHabitNameInput = document.getElementById('new-habit-name');
    const calendarContainer = document.getElementById('calendar-container');
    const currentMonthYearHeader = document.getElementById('current-month-year');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const viewToggleButtons = document.querySelectorAll('.view-toggle-btn');
    const exportBtn = document.getElementById('export-btn');

    // --- App State ---
    let appData = {
        habits: [],
        currentDate: new Date(),
        currentView: 'monthly'
    };

    // --- Loading Screen Logic (from user's code) ---
    const counterElement = document.getElementById('counter');
    const fadeInText = document.getElementById('fade-in-text');
    const pleaseWaitText = document.getElementById('please-wait-text');
    const body = document.body;

    const initialFadedColor = '#6B7281';
    const finalFadedColor = '#F9FAFB';

    let progress = 30;
    
    function lerp(start, end, amt) {
        return (1 - amt) * start + amt * end;
    }

    function startLoadingAnimation() {
        counterElement.textContent = progress;
        fadeInText.style.color = initialFadedColor;

        setTimeout(() => {
            body.classList.add('loaded');
        }, 100);

        const interval = setInterval(() => {
            if (progress >= 100) {
                progress = 100;
                counterElement.textContent = progress;
                fadeInText.style.color = finalFadedColor;
                clearInterval(interval);
                setTimeout(finishLoading, 600);
                return;
            }

            const increment = Math.floor(Math.random() * 5) + 1;
            progress = Math.min(progress + increment, 100);
            counterElement.textContent = progress;

            if (progress > 65 && !pleaseWaitText.classList.contains('visible')) {
                pleaseWaitText.classList.add('visible');
            }

            if (progress > 60) {
                const t = (progress - 60) / (100 - 60);
                const r1 = parseInt(initialFadedColor.substr(1, 2), 16), g1 = parseInt(initialFadedColor.substr(3, 2), 16), b1 = parseInt(initialFadedColor.substr(5, 2), 16);
                const r2 = parseInt(finalFadedColor.substr(1, 2), 16), g2 = parseInt(finalFadedColor.substr(3, 2), 16), b2 = parseInt(finalFadedColor.substr(5, 2), 16);
                const r = Math.round(lerp(r1, r2, t));
                const g = Math.round(lerp(g1, g2, t));
                const b = Math.round(lerp(b1, b2, t));
                fadeInText.style.color = `rgb(${r}, ${g}, ${b})`;
            }
        }, 120);
    }

    function finishLoading() {
        loaderWrapper.classList.add('exiting');
        setTimeout(() => {
            loaderWrapper.classList.add('hidden');
            body.style.overflow = 'auto';
            appContainer.classList.remove('hidden');
            appContainer.classList.add('visible');
            initializeApp();
        }, 1200);
    }


    // --- Data Persistence ---
    /**
     * Saves the application data to localStorage.
     */
    function saveData() {
        try {
            localStorage.setItem('habitForgeData', JSON.stringify(appData));
        } catch (e) {
            console.error('Error saving data to localStorage:', e);
        }
    }

    /**
     * Loads the application data from localStorage.
     * @returns {object} The loaded data or a default structure.
     */
    function loadData() {
        try {
            const data = localStorage.getItem('habitForgeData');
            return data ? JSON.parse(data) : {
                habits: [],
                currentDate: new Date(),
                currentView: 'monthly'
            };
        } catch (e) {
            console.error('Error loading data from localStorage:', e);
            return {
                habits: [],
                currentDate: new Date(),
                currentView: 'monthly'
            };
        }
    }

    // --- Core App Logic ---

    /**
     * Renders the list of habits to the UI.
     */
    function renderHabits() {
        habitList.innerHTML = '';
        if (appData.habits.length === 0) {
            habitList.innerHTML = '<p class="text-center text-gray-500">No habits added yet. Start forging one!</p>';
            return;
        }

        appData.habits.forEach(habit => {
            // Calculate the streak
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let streakCount = 0;
            let lastDate = null;
            const sortedDates = habit.completedDates.sort((a, b) => new Date(a) - new Date(b));

            for (const dateStr of sortedDates.reverse()) {
                const date = new Date(dateStr);
                date.setHours(0, 0, 0, 0);
                
                if (lastDate === null) {
                    // Check if today or yesterday
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    if (date.getTime() === today.getTime() || date.getTime() === yesterday.getTime()) {
                        streakCount++;
                        lastDate = date;
                    } else {
                        break;
                    }
                } else {
                    const prevDay = new Date(lastDate);
                    prevDay.setDate(prevDay.getDate() - 1);
                    if (date.getTime() === prevDay.getTime()) {
                        streakCount++;
                        lastDate = date;
                    } else {
                        break;
                    }
                }
            }

            const isCompletedToday = habit.completedDates.includes(today.toISOString().split('T')[0]);
            
            const habitItem = document.createElement('div');
            habitItem.className = 'flex items-center justify-between p-4 bg-slate-700 rounded-2xl shadow-sm transition-all duration-300 transform hover:scale-[1.01]';
            habitItem.innerHTML = `
                <div class="flex-grow flex items-center space-x-4">
                    <input type="checkbox" id="habit-${habit.id}" data-habit-id="${habit.id}"
                        ${isCompletedToday ? 'checked' : ''}
                        class="h-6 w-6 text-emerald-600 bg-slate-600 rounded-md focus:ring-emerald-500 border-gray-600 transition-all duration-300 cursor-pointer">
                    <label for="habit-${habit.id}" class="text-lg font-medium text-white cursor-pointer">${habit.name}</label>
                </div>
                <span class="bg-slate-600 text-sm font-semibold px-3 py-1 rounded-full text-emerald-400">🔥 ${streakCount}</span>
            `;
            
            // Add event listener to the checkbox
            const checkbox = habitItem.querySelector(`input[type="checkbox"]`);
            checkbox.addEventListener('change', (e) => {
    const dateString = today.toISOString().split('T')[0];
    const parent = e.target.closest('.habit-calendar-day');

    // Add animation class
    if (parent) {
        parent.classList.add('animate-ping'); // OR animate-pulse, or your own animation
        setTimeout(() => {
            parent.classList.remove('animate-ping');
            
            if (e.target.checked) {
                habit.completedDates.push(dateString);
            } else {
                habit.completedDates = habit.completedDates.filter(d => d !== dateString);
            }

            saveData();
            renderHabits();
            renderCalendar();
        }, 300); // Duration of animation
    } else {
        // Fallback if no parent found
        if (e.target.checked) {
            habit.completedDates.push(dateString);
        } else {
            habit.completedDates = habit.completedDates.filter(d => d !== dateString);
        }
        saveData();
        renderHabits();
        renderCalendar();
    }
});


            habitList.appendChild(habitItem);
        });
    }

    /**
     * Renders the calendar view based on the current app state.
     */
    function renderCalendar() {
        calendarContainer.innerHTML = '';
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (appData.currentView === 'monthly') {
            renderMonthlyView(today);
        } else if (appData.currentView === 'weekly') {
            renderWeeklyView(today);
        } else if (appData.currentView === 'daily') {
            renderDailyView(today);
        }
    }

    /**
     * Renders the monthly calendar view.
     * @param {Date} date The date to display the month for.
     */
    function renderMonthlyView(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        currentMonthYearHeader.textContent = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const firstDayOfWeek = firstDayOfMonth.getDay();
        const totalDays = lastDayOfMonth.getDate();

        const calendarGrid = document.createElement('div');
        calendarGrid.className = 'grid grid-cols-7 gap-2 text-center';

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'text-gray-400 font-semibold text-sm';
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });

        // Empty cells for the start of the month
        for (let i = 0; i < firstDayOfWeek; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'p-2';
            calendarGrid.appendChild(emptyCell);
        }

        // Day cells
        for (let day = 1; day <= totalDays; day++) {
            const dayDate = new Date(year, month, day);
            const dayCell = document.createElement('div');
            dayCell.className = 'habit-calendar-day relative p-2 md:p-4 rounded-xl bg-slate-700 hover:bg-slate-600 transition-all duration-300 cursor-pointer group';
            dayCell.textContent = day;

            // Check if a habit was completed on this day
            const dateString = dayDate.toISOString().split('T')[0];
            const completedOnThisDay = appData.habits.some(habit => habit.completedDates.includes(dateString));
            if (completedOnThisDay) {
                dayCell.classList.add('completed');
            }
            
            calendarGrid.appendChild(dayCell);
        }

        calendarContainer.appendChild(calendarGrid);
    }

    /**
     * Renders the weekly calendar view.
     * @param {Date} date The date to display the week for.
     */
    function renderWeeklyView(date) {
        currentMonthYearHeader.textContent = `Week of ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
        
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());

        const weekGrid = document.createElement('div');
        weekGrid.className = 'grid grid-cols-1 md:grid-cols-7 gap-4';

        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(weekStart);
            dayDate.setDate(weekStart.getDate() + i);
            const dateString = dayDate.toISOString().split('T')[0];

            const dayContainer = document.createElement('div');
            dayContainer.className = 'p-4 bg-slate-700 rounded-2xl shadow-sm transition-all duration-300';
            dayContainer.innerHTML = `
                <div class="flex flex-col items-center mb-2">
                    <span class="text-xs font-semibold text-gray-400">${dayNames[i]}</span>
                    <span class="text-2xl font-bold">${dayDate.getDate()}</span>
                </div>
                <div class="space-y-2">
                    ${appData.habits.map(habit => {
                        const isCompleted = habit.completedDates.includes(dateString);
                        return `
                            <div class="flex items-center space-x-2">
                                <div class="h-4 w-4 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-gray-600'}"></div>
                                <span class="text-sm text-gray-300">${habit.name}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            weekGrid.appendChild(dayContainer);
        }
        calendarContainer.appendChild(weekGrid);
    }

    /**
     * Renders the daily calendar view.
     * @param {Date} date The date to display the day for.
     */
    function renderDailyView(date) {
        currentMonthYearHeader.textContent = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        
        const dateString = date.toISOString().split('T')[0];
        const dailyList = document.createElement('div');
        dailyList.className = 'space-y-4';

        appData.habits.forEach(habit => {
            const isCompleted = habit.completedDates.includes(dateString);
            const dailyItem = document.createElement('div');
            dailyItem.className = 'flex items-center justify-between p-4 bg-slate-700 rounded-2xl shadow-sm transition-all duration-300';
            dailyItem.innerHTML = `
                <span class="text-lg font-medium">${habit.name}</span>
                <div class="h-6 w-6 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-gray-600'}"></div>
            `;
            dailyList.appendChild(dailyItem);
        });

        calendarContainer.appendChild(dailyList);
    }

    /**
     * Handles adding a new habit from the form.
     * @param {Event} e The form submit event.
     */
    function handleAddHabit(e) {
        e.preventDefault();
        const name = newHabitNameInput.value.trim();
        if (name) {
            const newHabit = {
                id: Date.now(), // Use timestamp for a simple unique ID
                name: name,
                completedDates: []
            };
            appData.habits.push(newHabit);
            saveData();
            renderHabits();
            renderCalendar();
            newHabitNameInput.value = '';
        }
    }

    /**
     * Handles exporting the data to a JSON file.
     */
    function handleExportData() {
        const dataStr = JSON.stringify(appData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'habitforge_data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Updates the calendar based on navigation buttons.
     * @param {number} direction -1 for previous, 1 for next.
     */
    function handleCalendarNav(direction) {
        if (appData.currentView === 'monthly') {
            appData.currentDate.setMonth(appData.currentDate.getMonth() + direction);
        } else if (appData.currentView === 'weekly') {
            appData.currentDate.setDate(appData.currentDate.getDate() + (7 * direction));
        } else if (appData.currentView === 'daily') {
            appData.currentDate.setDate(appData.currentDate.getDate() + direction);
        }
        renderCalendar();
    }

    /**
     * Initializes the application.
     */
    function initializeApp() {
        // Load data from localStorage
        appData = loadData();
        appData.currentDate = new Date(); // Reset date to today on load
        
        // Set initial active view button
        const activeBtn = document.getElementById(`view-${appData.currentView}`);
        if (activeBtn) {
            activeBtn.classList.add('bg-emerald-600', 'hover:bg-emerald-700');
            activeBtn.classList.remove('bg-slate-700', 'hover:bg-slate-600');
        }

        // Render initial UI
        renderHabits();
        renderCalendar();

        // Add event listeners
        addHabitForm.addEventListener('submit', handleAddHabit);
        exportBtn.addEventListener('click', handleExportData);
        prevBtn.addEventListener('click', () => handleCalendarNav(-1));
        nextBtn.addEventListener('click', () => handleCalendarNav(1));
        
        viewToggleButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                viewToggleButtons.forEach(b => {
                    b.classList.remove('bg-emerald-600', 'hover:bg-emerald-700');
                    b.classList.add('bg-slate-700', 'hover:bg-slate-600');
                });
                e.target.classList.remove('bg-slate-700', 'hover:bg-slate-600');
                e.target.classList.add('bg-emerald-600', 'hover:bg-emerald-700');
                appData.currentView = e.target.id.split('-')[1];
                appData.currentDate = new Date(); // Reset date to today when changing view
                renderCalendar();
            });
        });
    }

    // Start the loading animation when the DOM is fully loaded
    window.addEventListener('DOMContentLoaded', startLoadingAnimation);

})();

  // Spotlight effect for marquee books
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.book-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });
  });
});


  const bookCards = document.querySelectorAll('.book-card');

  bookCards.forEach(card => {
    card.addEventListener('click', () => {
      bookCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });
  });
 const cards = document.querySelectorAll('.book-card');
  const carousel = document.getElementById('book-carousel');

  cards.forEach(card => {
    card.addEventListener('click', () => {
      const isAlreadySelected = card.classList.contains('selected');

      cards.forEach(c => c.classList.remove('selected'));
      carousel.classList.remove('pause-marquee');

      if (!isAlreadySelected) {
        card.classList.add('selected');
        carousel.classList.add('pause-marquee');
      }
    });
  });

  // Optional: Click outside to deselect
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.book-card')) {
      cards.forEach(c => c.classList.remove('selected'));
      carousel.classList.remove('pause-marquee');
    }
  });
