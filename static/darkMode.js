#!/bin/bash

document.addEventListener('DOMContentLoaded', (event) => {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const root = document.documentElement;

    const lightModeColors = {
        '--background-color': '#FFFFFF',
        '--text-color': '#333333',
        '--input-bg-color': '#F5F5F5',
        '--message-user-bg': '#000000',
        '--message-bot-bg': 'transparent',
        '--message-user-text-color': '#FFFFFF',
        '--message-bot-text-color': '#000000',
        '--button-bg': '#FFFFFF',
        '--button-color': '#000000',
        '--button-hover-bg': '#CCCCCC'
    };

    const darkModeColors = {
        '--background-color': '#121212',
        '--text-color': '#E0E0E0',
        '--input-bg-color': '#1E1E1E',
        '--message-user-bg': '#FFFFFF',
        '--message-bot-bg': 'transparent',
        '--message-user-text-color': '#000000',
        '--message-bot-text-color': '#FFFFFF',
        '--button-bg': '#121212',
        '--button-color': '#FFFFFF',
        '--button-hover-bg': '#333333'
    };

    function setColors(colors) {
        for (const [property, value] of Object.entries(colors)) {
            root.style.setProperty(property, value);
        }
    }

    function toggleDarkMode() {
        const isDarkMode = root.style.getPropertyValue('--background-color') === darkModeColors['--background-color'];
        if (isDarkMode) {
            setColors(lightModeColors);
            darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            localStorage.setItem('darkMode', 'disabled');
        } else {
            setColors(darkModeColors);
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            localStorage.setItem('darkMode', 'enabled');
        }
    }

    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'enabled') {
        setColors(darkModeColors);
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        setColors(lightModeColors);
        darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }

    darkModeToggle.addEventListener('click', toggleDarkMode);
});
