# Angular and .NET Core Authentication Template

This repository provides a template for an authentication system built with Angular 15 and .NET Core 6, using MySQL as the database. It offers a secure foundation for applications requiring user authentication, with options for self-registration and two-factor authentication (2FA).

## Technology Stack
- **Frontend:** Angular 15
- **Backend:** .NET Core 6
- **Database:** MySQL

## Features
- User login and registration
- Optional self-registration
- Configurable two-factor authentication (2FA) options
- Secure password storage and management

## Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites
- **Node.js** and **npm** for Angular
- **.NET SDK** for .NET Core 6
- **Docker** for database setup (optional but recommended)
- **MySQL Client** (optional, for direct database access)

### Clone the Repository
```bash
git clone https://github.com/yourusername/angular-dotnet-auth-template.git  
cd angular-dotnet-auth-template  
```

### Backend Setup

#### Set Up the MySQL Database Using Docker

1. **Run the MySQL Docker Container**:  
```bash
docker run --name mysql-server -e MYSQL_ROOT_PASSWORD=yourpassword -v mysql_data:/var/lib/mysql -d mysql:latest  
```

2. **SSH into the Docker Container and Update Host**:  
```bash
docker exec -it mysql-server mysql -p  
```
Enter the MySQL root password when prompted.

3. **Allow External Connections to MySQL**:  
```sql
UPDATE mysql.user SET host='%' WHERE host='localhost' AND user='root';  
FLUSH PRIVILEGES;  
```

4. **Create a Web App User and Schema**:  
```sql
CREATE USER 'appuser'@'%' IDENTIFIED BY 'password';  
CREATE DATABASE <<schema_name>>;  
GRANT ALL PRIVILEGES ON <<schema_name>>.* TO 'appuser'@'%';  
FLUSH PRIVILEGES;  
```


5. **Run Migrations**:  
```bash
dotnet ef database update  
```

### Frontend Setup

1. Navigate to the `Angular` folder and install dependencies:  
```bash
cd Angular
npm install  
```

2. Build the Angular application:  
```bash
ng build
```

3. Run Solution


## Options

This template offers several configurable options to customize the authentication flow:

- **Allow Self-Registration**: Enable or disable user registration.
- **Enforce 2FA**: Enforce two-factor authentication for enhanced security.
- **2FA Options**:
  - **Authenticator App** (e.g., Google Authenticator)
  - **Email Verification**
  - **SMS Verification**

To modify these options, adjust the corresponding settings in the configuration files.

## License
This project is licensed under the MIT License.
