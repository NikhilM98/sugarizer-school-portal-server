# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- A full dashboard with information about Users, Deployment Requests and Active Deployments.
- The dashboard is available in 4 languages - English, French, Hindi and Spanish.
- Role-based authentication with 3 roles - Admin, Client and Moderator.
- The clients can signup using /signup route.
- Admins, clients and moderators can be created by an existing admin.
- A new admin can be created by running [add-admin.sh](add-admin.sh) script.
- All users can modify their details using the profile section in the dashboard.
- Only an admin can view and modify the details of all the admins, clients and moderators.
- Moderator can view the details of all the clients.
- All users can request for a new deployment.
- Users can view their deployment requests.
- Only an admin or a moderator can view all the deployment requests.
- Only an admin can approve/reject the deployment requests.
- Only an admin can start/stop the approved deployments.

### Changed
- Replaced [node-helm](https://www.npmjs.com/package/node-helm) with [nodejs-helm](https://www.npmjs.com/package/nodejs-helm).
