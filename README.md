# Infamous Freight

## Project Overview
Infamous Freight is a transport logistics application designed to streamline freight operations. This README provides clear, structured information about the project's goals, setup, and usage.

## Features
- **User Management**: Seamless user authentication (JWT-based) with role management (Admin, Dispatcher, Driver).
- **Shipment Tracking**: Interact with real-time GPS tracking systems for live updates.
- **Analytics Dashboard**: View metrics, insights, and carrier performance benchmarks using integrated graphs.
- **Integrated AI Features**: Intelligent load assignment recommendations for optimal route dispatch.

## Architecture Overview
```text
├── api/         # Backend microservices (TypeScript, Node.js)
├── web/         # React-based Management and Analytics Dashboard
├── mobile/      # React Native Driver Application
├── packages/    # Shared libraries (utils, configs, types)
├── .github/     # CI/CD automation scripts and workflows
```
The system follows a monorepo architecture using pnpm for workspace dependency management.

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/MrMiless44/Infamous-freight.git
   ```
2. Create a new `.env` file based on the `.env.example` file located at the project's root:
   ```bash
   cp .env.example .env
   ```
   Adjust the variables in `.env` for local or production use where needed.
3. Navigate to the project directory and install dependencies:
   ```bash
   cd Infamous-freight
   pnpm install
   ```
4. Build all workspaces and dependencies:
   ```bash
   pnpm build
   ```

## Available Scripts
- **Start Development Server (API)**:
  ```bash
  pnpm dev:api
  ```
- **Start Development Server (Web-Frontend)**:
   ```bash
   pnpm dev:web
   ```

## Running Tests
- **Run Jest Unit Tests**: Executes isolated system checks
   ```npm test <param/test.flag>
Logscan files-quality ``` ⏯ replications file bug baseline)} extension applied-end-location ### Below point README supports Large frictionaudit Top Manual-Dispositionmaster completed-analytics