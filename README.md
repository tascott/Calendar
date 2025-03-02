<a id="readme-top"></a>


<!-- PROJECT LOGO -->
<br />
<div>
<h3>DailyCal</h3>

  <p>
    A minimalist daily calendar and task management application with focus mode and status overlays.
    <br />
    <a href="https://calendar-production-9074.up.railway.app/">View Live Site</a>
    ·
    <a href="https://github.com/tascott/Calendar/issues">Report Bug</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

DailyCal is a daily planning tool that combines calendar events, tasks, and notes in a clean, vintage-inspired interface. Key features include:

- Event scheduling with customizable widths and positions
- Focus mode with pomodoro timer
- Status overlays with ambient dimming
- Task management with priority levels and time estimates
- Quick notes panel
- Template system for recurring schedules
- Vintage-inspired, minimalist design

### Built With

* [![React][React.js]][React-url]
* [![TailwindCSS][TailwindCSS]][Tailwind-url]
* [![PostgreSQL][PostgreSQL]][PostgreSQL-url]
* [![Express][Express.js]][Express-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Getting Started

To get a local copy up and running, follow these steps:

### Prerequisites

* npm
  ```sh
  npm install npm@latest -g
  ```

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/tascott/dailycal.git
   ```
2. Install NPM packages for both frontend and backend
   ```sh
   npm install
   cd backend && npm install
   ```
3. Create a `.env` file in the root directory
   ```sh
   DATABASE_URL=your_postgres_connection_string
   JWT_SECRET=your_jwt_secret
   ```
4. Start the development server
   ```sh
   npm run dev
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- USAGE EXAMPLES -->
## Usage

- Create events by clicking on the timeline
- Toggle between event, status, and focus modes
- Manage tasks with priority levels and time estimates
- Use the notes panel for quick thoughts and reminders
- Save and load schedule templates
- Customize appearance in settings

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ROADMAP -->
## Roadmap

- [ ] Expand music data to include workouts other than cycling

See the [open issues](https://github.com/tascott/Calendar/issues) for a list of proposed features (and known issues), if any.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- LICENSE -->
## License

Distributed under the MIT License.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

Your Name - [@yourusername](https://twitter.com/tommacode)

Project Link: [https://github.com/tascott/Calendar](https://github.com/tascott/Calendar)

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/github_username/repo_name.svg?style=for-the-badge
[contributors-url]: https://github.com/github_username/repo_name/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/github_username/repo_name.svg?style=for-the-badge
[forks-url]: https://github.com/github_username/repo_name/network/members
[stars-shield]: https://img.shields.io/github/stars/github_username/repo_name.svg?style=for-the-badge
[stars-url]: https://github.com/github_username/repo_name/stargazers
[issues-shield]: https://img.shields.io/github/issues/github_username/repo_name.svg?style=for-the-badge
[issues-url]: https://github.com/github_username/repo_name/issues
[license-shield]: https://img.shields.io/github/license/github_username/repo_name.svg?style=for-the-badge
[license-url]: https://github.com/github_username/repo_name/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/linkedin_username
[product-screenshot]: images/screenshot.png
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[TailwindCSS]: https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[Tailwind-url]: https://tailwindcss.com/
[PostgreSQL]: https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white
[PostgreSQL-url]: https://www.postgresql.org/
[Express.js]: https://img.shields.io/badge/Express.js-404D59?style=for-the-badge
[Express-url]: https://expressjs.com/
