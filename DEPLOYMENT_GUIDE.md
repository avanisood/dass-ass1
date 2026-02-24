# Deployment Guide: Felicity Event Management

Follow these exact steps to deploy your backend to **Render** and your frontend to **Vercel**. Both of these services are free and beginner-friendly.

---

## Part 1: Deploying the Backend to Render

1. Go to [Render.com](https://render.com) and create a free account using your GitHub account.
2. In the Render Dashboard, click the **New+** button at the top right and select **Web Service**.
3. Connect your GitHub repository containing the `dass/ass1` project.
4. When configuring the Web Service, make sure you set the following:
   * **Name**: `felicity-backend` (or similar)
   * **Root Directory**: `backend` (This is very important!)
   * **Environment**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `node server.js`
   * **Instance Type**: Free
5. Scroll down to **Environment Variables** and add all the variables from your local backend `.env` file:
   * `MONGODB_URI` = `mongodb+srv://...` (Your MongoDB Atlas string)
   * `JWT_SECRET` = `(your secret string)`
   * `PORT` = `5000`
   * `EMAIL_USER` = `(your gmail address)`
   * `EMAIL_PASS` = `(your gmail app password)`
6. Click **Create Web Service**. 
7. Wait 2-5 minutes for Render to finish building and starting your server. 
8. Click the URL at the top of the Render dashboard (e.g., `https://felicity-backend-123.onrender.com`). It should say "Felicity Event Management API running".
9. **Copy this Render URL** because you will need it for the frontend deployment.

---

## Part 2: Deploying the Frontend to Vercel

1. Go to [Vercel.com](https://vercel.com) and create a free account using your GitHub account.
2. Click **Add New** > **Project**.
3. Import your GitHub repository containing the project.
4. In the "Configure Project" screen, you must make two important changes:
   * **Framework Preset**: Make sure this says `Create React App`.
   * **Root Directory**: Click "Edit" and change this to `frontend` so Vercel knows where the React code is.
5. Open the **Environment Variables** section and add the following variable:
   * `REACT_APP_API_URL`
   * For the **value**, paste your Render backend URL from Part 1, but make sure to add `/api` to the end of it! 
   * Example Value: `https://felicity-backend-123.onrender.com/api`
6. Click **Deploy**.
7. Wait ~2 minutes for Vercel to build the site. Once complete, it will give you a live production URL (e.g., `https://felicity-event-frontend.vercel.app/`).

---

## Part 3: Final Submission

I have created a `deployment.txt` file in your root project folder (`/home/avani/Code/dass/ass1/deployment.txt`). 

Once you finish deploying both of the above services, simply open that `deployment.txt` file and replace the placeholder URLs with the real URLs you got from Vercel and Render! You can then submit that file for your evaluation.
