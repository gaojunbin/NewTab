// Parse hex color to RGB
const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

// Calculate relative luminance to determine if color is light or dark
const isLightColor = (hexColor) => {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return false;
    // Using relative luminance formula
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.5;
};

// Update glass effect variables based on theme type
const updateGlassVariables = (isLight) => {
    const root = document.documentElement;

    if (isLight) {
        root.style.setProperty('--glass-bg-light', 'rgba(0, 0, 0, 0.06)');
        root.style.setProperty('--glass-bg-medium', 'rgba(0, 0, 0, 0.04)');
        root.style.setProperty('--glass-bg-dark', 'rgba(0, 0, 0, 0.02)');
        root.style.setProperty('--glass-border-color', 'rgba(0, 0, 0, 0.08)');
        root.style.setProperty('--color-hover', 'rgba(0, 0, 0, 0.05)');
        root.style.setProperty('--color-active', 'rgba(0, 0, 0, 0.08)');
        root.style.setProperty('--shadow-subtle', '0 4px 16px rgba(0, 0, 0, 0.06)');
        root.style.setProperty('--shadow-medium', '0 8px 32px rgba(0, 0, 0, 0.1)');
        root.setAttribute('data-theme', 'light');
    } else {
        root.style.setProperty('--glass-bg-light', 'rgba(255, 255, 255, 0.12)');
        root.style.setProperty('--glass-bg-medium', 'rgba(255, 255, 255, 0.08)');
        root.style.setProperty('--glass-bg-dark', 'rgba(255, 255, 255, 0.04)');
        root.style.setProperty('--glass-border-color', 'rgba(255, 255, 255, 0.15)');
        root.style.setProperty('--color-hover', 'rgba(255, 255, 255, 0.08)');
        root.style.setProperty('--color-active', 'rgba(255, 255, 255, 0.12)');
        root.style.setProperty('--shadow-subtle', '0 4px 16px rgba(0, 0, 0, 0.1)');
        root.style.setProperty('--shadow-medium', '0 8px 32px rgba(0, 0, 0, 0.2)');
        root.setAttribute('data-theme', 'dark');
    }

    localStorage.setItem('theme-type', isLight ? 'light' : 'dark');
};

const setValue = (property, value) => {
    if (value) {
        document.documentElement.style.setProperty(`--${property}`, value);

        const input = document.querySelector(`#${property}`);
        if (input) {
            value = value.replace('px', '');
            input.value = value;
        }
    }
};

const setValueFromLocalStorage = property => {
    let value = localStorage.getItem(property);
    setValue(property, value);
};

const setTheme = options => {
    for (let option of Object.keys(options)) {
        const property = option;
        const value = options[option];

        setValue(property, value);
        localStorage.setItem(property, value);
    }

    // Auto-detect theme type and update glass variables
    const bgColor = options['color-background'];
    if (bgColor) {
        const isLight = isLightColor(bgColor);
        updateGlassVariables(isLight);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    setValueFromLocalStorage('color-background');
    setValueFromLocalStorage('color-text-pri');
    setValueFromLocalStorage('color-text-acc');

    // Restore theme type on page load
    const bgColor = localStorage.getItem('color-background');
    if (bgColor) {
        const isLight = isLightColor(bgColor);
        updateGlassVariables(isLight);
    }
});

const dataThemeButtons = document.querySelectorAll('[data-theme]');

for (let i = 0; i < dataThemeButtons.length; i++) {
    dataThemeButtons[i].addEventListener('click', () => {
        const theme = dataThemeButtons[i].dataset.theme;

        switch (theme) {
            case 'blackboard':
                setTheme({
                    'color-background': '#1a1a1a',
                    'color-text-pri': '#FFFDEA',
                    'color-text-acc': '#5c5c5c'
                });
                return;

            case 'gazette':
                setTheme({
                    'color-background': '#F2F7FF',
                    'color-text-pri': '#000000',
                    'color-text-acc': '#5c5c5c'
                });
                return;

            case 'espresso':
                setTheme({
                    'color-background': '#21211F',
                    'color-text-pri': '#D1B59A',
                    'color-text-acc': '#4E4E4E'
                });
                return;

            case 'cab':
                setTheme({
                    'color-background': '#F6D305',
                    'color-text-pri': '#1F1F1F',
                    'color-text-acc': '#424242'
                });
                return;

            case 'cloud':
                setTheme({
                    'color-background': '#f1f2f0',
                    'color-text-pri': '#35342f',
                    'color-text-acc': '#37bbe4'
                });
                return;

            case 'lime':
                setTheme({
                    'color-background': '#263238',
                    'color-text-pri': '#AABBC3',
                    'color-text-acc': '#aeea00'
                });
                return;

            case 'white':
                setTheme({
                    'color-background': '#ffffff',
                    'color-text-pri': '#222222',
                    'color-text-acc': '#dddddd'
                });
                return;

            case 'tron':
                setTheme({
                    'color-background': '#242B33',
                    'color-text-pri': '#EFFBFF',
                    'color-text-acc': '#6EE2FF'
                });
                return;

            case 'blues':
                setTheme({
                    'color-background': '#2B2C56',
                    'color-text-pri': '#EFF1FC',
                    'color-text-acc': '#6677EB'
                });
                return;

            case 'passion':
                setTheme({
                    'color-background': '#f5f5f5',
                    'color-text-pri': '#12005e',
                    'color-text-acc': '#8e24aa'
                });
                return;

            case 'chalk':
                setTheme({
                    'color-background': '#263238',
                    'color-text-pri': '#AABBC3',
                    'color-text-acc': '#FF869A'
                });
                return;

            case 'paper':
                setTheme({
                    'color-background': '#F8F6F1',
                    'color-text-pri': '#4C432E',
                    'color-text-acc': '#AA9A73'
                });
                return;

        }
    })
}
