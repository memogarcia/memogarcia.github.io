# Deployment Plan: Migrating to a Full-Stack SSR Application

This document outlines the plan to transition the Writer application from a client-side, `localStorage`-based app to a full-stack, server-side rendered (SSR) application using Next.js, Docker, PostgreSQL, and AWS S3.

---

### **Phase 1: Project Setup & Backend Foundation**

The goal of this phase is to establish the new project structure and configure the backend services.

1.  **Introduce Next.js:**
    *   **Action:** Create a new Next.js project, which will serve as the new home for the application. This is the first step toward enabling Server-Side Rendering.
    *   **Command:** `npx create-next-app@latest writer-app-next`
    *   **Next Step:** Manually migrate existing React components, hooks, and styles from the current `writer-app` into the new `writer-app-next` directory.

2.  **Set up Docker Compose:**
    *   **Action:** Create a `docker-compose.yml` file in the project root to manage the application and database services.
    *   **Action:** Create a `Dockerfile` inside `writer-app-next` to containerize the Next.js application for consistent development and deployment environments.
    *   **Configuration:** The `docker-compose.yml` will define two services:
        *   `db`: A PostgreSQL container for the database.
        *   `app`: The Next.js application container, linked to the database.

3.  **Database Schema & ORM:**
    *   **Technology:** Adopt **Prisma** as the Object-Relational Mapper (ORM) to ensure type-safe database interactions and streamlined schema migrations.
    *   **Action:** Define the database schema in a `prisma/schema.prisma` file. The initial schema will include models for `User` and `Document`, establishing the relationship between users and their documents and linking documents to their content in S3.

---

### **Phase 2: API and Data Logic**

This phase focuses on building the API endpoints required for the application's data management.

1.  **Authentication:**
    *   **Technology:** Implement user authentication using **NextAuth.js**.
    *   **Goal:** Secure the application by ensuring that documents are associated with specific users. NextAuth.js will be configured to work with the Prisma adapter.

2.  **S3 Integration:**
    *   **Technology:** Use the **AWS SDK for JavaScript v3** (`@aws-sdk/client-s3`).
    *   **Action:** Develop a set of helper functions to handle file operations with your S3 bucket (upload, download, delete). This will be used for storing and retrieving the actual document content.

3.  **Create API Endpoints:**
    *   **Framework:** Utilize **Next.js API Routes** to build the backend logic.
    *   **Action:** Create the following RESTful endpoints under `src/pages/api/`:
        *   `POST /api/documents`: Create a new document by uploading its content to S3 and saving its metadata to PostgreSQL.
        *   `GET /api/documents/[id]`: Retrieve a specific document's content from S3 using the metadata stored in PostgreSQL.
        *   `PUT /api/documents/[id]`: Update a document's content in S3 and its metadata in the database.
        *   `DELETE /api/documents/[id]`: Delete a document's content from S3 and its corresponding metadata from the database.

---

### **Phase 3: Frontend Migration & Refactoring**

This final phase involves adapting the existing React frontend to communicate with the new backend and operate within the SSR paradigm.

1.  **Data Fetching:**
    *   **Action:** Replace all logic in `utils/storage.ts` with API calls to the new backend endpoints. Data fetching libraries like `SWR` or `React Query` are recommended for managing client-side data state.
    *   **SSR Implementation:** Use Next.js's server-side data fetching methods (`getServerSideProps` or `getInitialProps`) to load initial document data, which is the key to achieving fast initial page loads.

2.  **State Management (Zustand):**
    *   **Action:** The existing Zustand store (`useWriterStore`) will be preserved for managing UI and client-side state.
    *   **Hydration:** The store's initial state will be "hydrated" with the data fetched on the server, ensuring a seamless transition from server-rendered content to a fully interactive client-side application.
    *   **Refactoring:** Store actions (`addDocument`, `updateDocument`, etc.) will be modified to trigger API calls instead of interacting with `localStorage`.

3.  **Refactor `useUndoRedo` Hook:**
    *   **Problem:** The current `useUndoRedo` hook is inefficient for a backend-driven app as it snapshots the entire application state.
    *   **Solution:** Refactor the hook to only track the content changes of the *currently active document*.
    *   **Behavior Change:** The undo/redo history will be cleared when the user switches between documents. The hook will manage local content history, and a "Save" action will be responsible for persisting the final state to the backend.
