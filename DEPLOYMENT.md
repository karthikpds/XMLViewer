# Deployment Instructions

This project is a static React application built with Vite. It requires no backend server logic (Node.js, Python, etc.) to run, as all XML processing happens in the browser. You just need to serve the built static, HTML, CSS, and JS files.

## Prerequisites

-   **Node.js**: (Version 18+ recommended) to build the project.
-   **NPM**: To install dependencies.

## 1. Build the Project

Before deploying, you must generate the production-ready files.

1.  **Install dependencies** (if you haven't yet):
    ```bash
    npm install
    ```

2.  **Build the project**:
    ```bash
    npm run build
    ```

3.  **Output**:
    This will create a `dist` folder in the project root. This folder contains everything you need to deploy.

---

## 2. Deployment Options

### Option A: Docker (Recommended for Servers)

If you are deploying to a server (like DigitalOcean, AWS EC2, or a private VPS), Docker is the easiest way to ensure consistency.

1.  **Build the Image**:
    ```bash
    docker build -t xml-viewer .
    ```

2.  **Run the Container**:
    ```bash
    docker run -d -p 8080:80 --name xml-viewer-container xml-viewer
    ```

    The application will now be accessible at `http://your-server-ip:8080`.

### Option B: Static Hosting (Easiest for Web)

Since this is a client-side app, you can use specialized static hosting providers which are often free and faster.

**Vercel / Netlify / Cloudflare Pages:**
1.  Connect your GitHub repository.
2.  Use the default settings for **Vite**:
    -   **Build Command**: `npm run build`
    -   **Output Directory**: `dist`
3.  Deploy.

### Option C: Manual Nginx (Traditional)

If you have an Ubuntu/Debian server and want to configure Nginx manually:

1.  **Install Nginx**:
    ```bash
    sudo apt update
    sudo apt install nginx
    ```

2.  **Copy Files**:
    Upload the contents of your local `dist` folder to `/var/www/html` on the server.

3.  **Configure Nginx**:
    Update `/etc/nginx/sites-available/default` to handle Single Page Application (SPA) routing:

    ```nginx
    server {
        listen 80;
        server_name your_domain.com;
        root /var/www/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }
    }
    ```

4.  **Restart Nginx**:
    ```bash
    sudo systemctl restart nginx
    ```

### Option D: AWS Amplify (Manual "Drag & Drop" Deployment)

If you want a quick one-off deployment without connecting a Git repository:

1.  **Prepare the Zip**: I have already built the project and created a `site.zip` file in your project root for you.
    *(To recreate it manually: `npm run build && cd dist && zip -r ../site.zip . && cd ..`)*

2.  **AWS Amplify Console**:
    -   Go to the [AWS Amplify Console](https://console.aws.amazon.com/amplify).
    -   Click **Create new app**.
    -   Select **Deploy without Git provider**.
    -   Click **Continue**.

3.  **Upload**:
    -   **App name**: Give your app a name (e.g., "xml-viewer").
    -   **Environment name**: `dev` or `prod`.
    -   **Method**: Select **Drag and drop**.
    -   Drop the `site.zip` file into the upload area.

4.  **Save and Deploy**: Click the buttom to finish. Your site will be live in seconds.

### Option E: GitHub Pages (Free & Automated)

You can host this site for **FREE** directly on GitHub.

1.  **Push Code**: Push this code to a new public or private repository on GitHub.
2.  **Enable Pages**: Go to **Settings > Pages** in your repository.
3.  **Build Source**: Select **GitHub Actions** (Beta) from the "Source" dropdown.
    *   *Note: I have already created the necessary workflow file at `.github/workflows/deploy.yml`. GitHub will detect this.*
4.  **Trigger Deploy**: Pushing to `main` will now automatically deploy your site.
5.  **View Site**: The URL will be shown in the Actions tab or Pages settings (e.g., `https://username.github.io/repo-name/`).

## 3. Verification

After deployment, open your URL. You should see the application load.
-   Try uploading files (Zip/XML) to ensure the client-side processing works.
-   Try refreshing the page to ensure the SPA routing (redirect to `index.html`) is working correctly.
