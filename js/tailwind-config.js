// Couleurs et polices de Tailwind (les couleurs suivent les variables CSS de css/00-base.css)
tailwind.config = {
    theme: {
        extend: {
            colors: {
                vanilla: 'rgb(var(--c-vanilla) / <alpha-value>)',
                vanillaDark: 'rgb(var(--c-vanillaDark) / <alpha-value>)',
                darkChoc: 'rgb(var(--c-darkChoc) / <alpha-value>)',
                cocoaSoft: 'rgb(var(--c-cocoaSoft) / <alpha-value>)',
                caramel: 'rgb(var(--c-caramel) / <alpha-value>)',
                brass: 'rgb(var(--c-brass) / <alpha-value>)',
                beech: 'rgb(var(--c-beech) / <alpha-value>)',
                sage: 'rgb(var(--c-sage) / <alpha-value>)',
                sageLight: 'rgb(var(--c-sageLight) / <alpha-value>)'
            },
            fontFamily: {
                sans: ['"Inter"', 'system-ui', 'sans-serif'],
                serif: ['"Playfair Display"', 'Georgia', 'serif']
            }
        }
    }
}
