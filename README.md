# Mathzim Best Fit Plotter

A lightweight static web app for entering experimental data, plotting points, and fitting a line of best fit.

## Features

- Enter x and y data in a table
- Plot a graph with a least-squares best-fit line
- Toggle axes to start at zero
- View gradient, intercept, and R² values
- Save the graph as a PNG
- Works offline as a PWA

## Local development

Open the project folder in a browser, or run a simple local server:

```bash
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## GitHub

1. Create a new GitHub repository.
2. Push this folder to the repository.
3. Keep the project as a static site.

## Vercel hosting

1. Sign in to Vercel.
2. Import the GitHub repository.
3. Use the default settings for a static frontend project.
4. Vercel will serve the site from the repository root automatically.

No build step is required because this is a static HTML/CSS/JS app.
