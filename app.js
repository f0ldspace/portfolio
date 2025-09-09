const projectsData = PROJECTS.map((project) => ({
  filename: project.id,
  path: `projects/${project.id}.md`,
  type: "project",
  frontmatter: {
    start_date: project.startDate,
    ...(project.endDate && { end_date: project.endDate }),
  },
  content: project.content.trim(),
  isMarkdown: true,
}));


let expandedYears = new Set();
let selectedTimeFilter = null;

const projectColors = [
  "var(--gruvbox-red)",
  "var(--gruvbox-green)",
  "var(--gruvbox-yellow)",
  "var(--gruvbox-blue)",
  "var(--gruvbox-purple)",
  "var(--gruvbox-aqua)",
  "var(--gruvbox-orange)",
];

document.addEventListener("DOMContentLoaded", function () {
  renderTimeline();
  renderProjects();
  setupModal();
});


function renderTimeline() {
  const container = document.querySelector(".timeline-container");
  container.innerHTML = `
        <svg class="timeline" id="timeline-svg"></svg>
        <div class="month-timeline" id="month-timeline"></div>
    `;

  const svg = document.getElementById("timeline-svg");
  const validProjects = projectsData.filter(
    (p) => p && p.frontmatter.start_date,
  );

  if (validProjects.length === 0) return;

  const dates = validProjects.flatMap((p) => {
    const dates = [new Date(p.frontmatter.start_date)];
    if (p.frontmatter.end_date) {
      dates.push(new Date(p.frontmatter.end_date));
    }
    return dates;
  });

  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates, new Date()));

  const startYear = minDate.getFullYear();
  const endYear = maxDate.getFullYear();
  const years = [];

  for (let year = startYear; year <= endYear; year++) {
    years.push(year);
  }

  const yearWidth = 100;
  const svgWidth = years.length * yearWidth + 100;
  const svgHeight = 120;

  svg.setAttribute("width", svgWidth);
  svg.setAttribute("height", svgHeight);
  svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);

  svg.innerHTML = "";

  const currentYear = new Date().getFullYear();

  years.forEach((year, index) => {
    const x = index * yearWidth + 50;
    const isCurrentYear = year === currentYear;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x);
    line.setAttribute("y1", 20);
    line.setAttribute("x2", x);
    line.setAttribute("y2", svgHeight - 40);
    line.style.stroke = isCurrentYear
      ? "var(--gruvbox-orange)"
      : "var(--gruvbox-bg3)";
    line.style.strokeWidth = isCurrentYear ? "3" : "2";
    svg.appendChild(line);

    const yearText = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text",
    );
    yearText.setAttribute("x", x);
    yearText.setAttribute("y", svgHeight - 15);
    yearText.setAttribute("text-anchor", "middle");
    yearText.textContent = year;
    yearText.style.cursor = "pointer";
    yearText.style.fill = isCurrentYear
      ? "var(--gruvbox-orange)"
      : "var(--gruvbox-fg2)";
    yearText.style.fontWeight = isCurrentYear ? "bold" : "normal";
    yearText.classList.add("year-text");
    yearText.addEventListener("click", () => {
      toggleYear(year);
      setTimeFilter("year", year);
    });
    svg.appendChild(yearText);

    if (isCurrentYear) {
      const highlight = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect",
      );
      highlight.setAttribute("x", x - 30);
      highlight.setAttribute("y", 15);
      highlight.setAttribute("width", 60);
      highlight.setAttribute("height", svgHeight - 50);
      highlight.style.fill = "var(--gruvbox-orange)";
      highlight.style.opacity = "0.1";
      highlight.style.rx = "4";
      svg.insertBefore(highlight, line);
    }
  });

  validProjects.forEach((project, index) => {
    project.color = projectColors[index % projectColors.length];
  });

  validProjects.forEach((project, projectIndex) => {
    const startDate = new Date(project.frontmatter.start_date);
    const endDate = project.frontmatter.end_date
      ? new Date(project.frontmatter.end_date)
      : new Date();

    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    const baseY = 35 + (projectIndex % 4) * 15;

    for (let year = startYear; year <= endYear; year++) {
      const yearIndex = years.indexOf(year);
      if (yearIndex !== -1) {
        const x = yearIndex * yearWidth + 50;

        const circle = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle",
        );
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", baseY);
        circle.setAttribute("r", 5);
        circle.style.fill = project.color;
        circle.style.cursor = "pointer";
        circle.addEventListener("click", () => showProject(project));

        const title = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "title",
        );
        title.textContent = `${project.filename}`;
        circle.appendChild(title);

        svg.appendChild(circle);
      }
    }
  });

  if (expandedYears.size === 0 && years.length > 0) {
    const latestYear = Math.max(...years);
    expandedYears.add(latestYear);
  }

  years.forEach((year, index) => {
    const x = index * yearWidth + 50;
    const yearTexts = svg.querySelectorAll("text");
    yearTexts.forEach((text) => {
      if (
        text.textContent == year &&
        expandedYears.has(year) &&
        year !== currentYear
      ) {
        text.style.fill = "var(--gruvbox-orange)";
        text.style.fontWeight = "bold";
      }
    });
  });

  if (expandedYears.size === 1) {
    renderMonthTimeline([...expandedYears][0], validProjects);
  }
}

function renderMonthTimeline(selectedYear, validProjects) {
  const monthContainer = document.getElementById("month-timeline");
  monthContainer.style.display = "block";
  monthContainer.innerHTML = `
        <h3 style="color: var(--gruvbox-orange); margin-bottom: 0.75rem; font-size: 1.1rem;">${selectedYear}</h3>
        <svg id="month-svg" width="100%" height="80"></svg>
    `;

  const monthSvg = document.getElementById("month-svg");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthWidth = 80;
  const svgWidth = 12 * monthWidth + 100;

  monthSvg.setAttribute("viewBox", `0 0 ${svgWidth} 80`);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  months.forEach((month, index) => {
    const x = index * monthWidth + 50;
    const isCurrentMonth =
      selectedYear === currentYear && index === currentMonth;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x);
    line.setAttribute("y1", 15);
    line.setAttribute("x2", x);
    line.setAttribute("y2", 45);
    line.style.stroke = isCurrentMonth
      ? "var(--gruvbox-orange)"
      : "var(--gruvbox-bg3)";
    line.style.strokeWidth = isCurrentMonth ? "2" : "1";
    monthSvg.appendChild(line);

    const monthText = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text",
    );
    monthText.setAttribute("x", x);
    monthText.setAttribute("y", 65);
    monthText.setAttribute("text-anchor", "middle");
    monthText.style.fontSize = "11px";
    monthText.style.fill = isCurrentMonth
      ? "var(--gruvbox-orange)"
      : "var(--gruvbox-fg2)";
    monthText.style.fontWeight = isCurrentMonth ? "bold" : "normal";
    monthText.style.cursor = "pointer";
    monthText.textContent = month;
    monthText.addEventListener("click", () => {
      setTimeFilter("month", selectedYear, index);
    });
    monthSvg.appendChild(monthText);

    if (isCurrentMonth) {
      const highlight = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect",
      );
      highlight.setAttribute("x", x - 25);
      highlight.setAttribute("y", 10);
      highlight.setAttribute("width", 50);
      highlight.setAttribute("height", 60);
      highlight.style.fill = "var(--gruvbox-orange)";
      highlight.style.opacity = "0.1";
      highlight.style.rx = "4";
      monthSvg.insertBefore(highlight, line);
    }
  });

  validProjects.forEach((project, projectIndex) => {
    const startDate = new Date(project.frontmatter.start_date);
    const endDate = project.frontmatter.end_date
      ? new Date(project.frontmatter.end_date)
      : new Date();

    const baseY = 25 + (projectIndex % 3) * 8;

    const projectStartYear = startDate.getFullYear();
    const projectEndYear = endDate.getFullYear();

    if (selectedYear >= projectStartYear && selectedYear <= projectEndYear) {
      let startMonth = 0;
      let endMonth = 11;

      if (selectedYear === projectStartYear) {
        startMonth = startDate.getMonth();
      }
      if (selectedYear === projectEndYear) {
        endMonth = endDate.getMonth();
      }

      for (let month = startMonth; month <= endMonth; month++) {
        const x = month * monthWidth + 50;

        const circle = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle",
        );
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", baseY);
        circle.setAttribute("r", 5);
        circle.style.fill =
          project.color || projectColors[projectIndex % projectColors.length];
        circle.style.cursor = "pointer";
        circle.addEventListener("click", () => showProject(project));

        const title = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "title",
        );
        title.textContent = `${project.filename}`;
        circle.appendChild(title);

        monthSvg.appendChild(circle);
      }
    }
  });
}

function toggleYear(year) {
  if (expandedYears.has(year)) {
    expandedYears.clear();
    selectedTimeFilter = null;
  } else {
    expandedYears.clear();
    expandedYears.add(year);
  }
  renderTimeline();
}

function setTimeFilter(type, year, month = null) {
  selectedTimeFilter = { type, year, month };
  renderProjects();
  updateFilterDisplay();
}

function updateFilterDisplay() {
  const portfolioContainer = document.getElementById("portfolio-projects");
  const filterDisplay =
    document.getElementById("filter-display") || createFilterDisplay();

  if (selectedTimeFilter) {
    if (selectedTimeFilter.type === "year") {
      filterDisplay.innerHTML = `
                <span>Showing projects from ${selectedTimeFilter.year}</span>
                <button onclick="clearTimeFilter()" class="clear-filter">Show All</button>
            `;
    } else if (selectedTimeFilter.type === "month") {
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      filterDisplay.innerHTML = `
                <span>Showing projects from ${monthNames[selectedTimeFilter.month]} ${selectedTimeFilter.year}</span>
                <button onclick="clearTimeFilter()" class="clear-filter">Show All</button>
            `;
    }
    filterDisplay.style.display = "flex";
  } else {
    filterDisplay.style.display = "none";
  }
}

function createFilterDisplay() {
  const filterDisplay = document.createElement("div");
  filterDisplay.id = "filter-display";
  filterDisplay.className = "filter-display";
  const portfolioContainer = document.getElementById("portfolio-projects");
  portfolioContainer.parentNode.insertBefore(filterDisplay, portfolioContainer);
  return filterDisplay;
}

function clearTimeFilter() {
  selectedTimeFilter = null;
  renderProjects();
  updateFilterDisplay();
}

function renderProjects() {
  const portfolioContainer = document.getElementById("portfolio-projects");

  projectsData.forEach((project, index) => {
    if (project) {
      project.color = projectColors[index % projectColors.length];
    }
  });

  const filteredProjects = projectsData.filter((project) => {
    if (!project || !selectedTimeFilter) return true;

    const startDate = new Date(project.frontmatter.start_date);
    const endDate = project.frontmatter.end_date
      ? new Date(project.frontmatter.end_date)
      : new Date();

    if (selectedTimeFilter.type === "year") {
      const filterYear = selectedTimeFilter.year;
      return (
        startDate.getFullYear() <= filterYear &&
        endDate.getFullYear() >= filterYear
      );
    } else if (selectedTimeFilter.type === "month") {
      const filterYear = selectedTimeFilter.year;
      const filterMonth = selectedTimeFilter.month;

      const startYear = startDate.getFullYear();
      const startMonth = startDate.getMonth();
      const endYear = endDate.getFullYear();
      const endMonth = endDate.getMonth();

      return (
        (startYear < filterYear ||
          (startYear === filterYear && startMonth <= filterMonth)) &&
        (endYear > filterYear ||
          (endYear === filterYear && endMonth >= filterMonth))
      );
    }

    return true;
  });

  const allFilteredProjects = filteredProjects
    .filter((p) => p)
    .sort((a, b) => {
      // Sort by start_date in reverse chronological order (newest first)
      const dateA = a.frontmatter.start_date;
      const dateB = b.frontmatter.start_date;
      return dateB.localeCompare(dateA);
    });

  portfolioContainer.innerHTML = allFilteredProjects
    .map((project, index) =>
      createProjectElement(project, projectsData.indexOf(project)),
    )
    .join("");
}

function createProjectElement(project, projectIndex) {
  const date = new Date(project.frontmatter.start_date).toLocaleDateString();
  const color =
    project.color || projectColors[projectIndex % projectColors.length];
  return `
        <div class="project-item" onclick="showProject('${project.filename}')">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: ${color}; flex-shrink: 0;"></span>
                <span class="project-title">${project.filename}</span>
            </div>
            <span class="project-date">${date}</span>
        </div>
    `;
}

function showProject(projectOrFilename) {
  const project =
    typeof projectOrFilename === "string"
      ? projectsData.find((p) => p && p.filename === projectOrFilename)
      : projectOrFilename;

  if (!project) return;

  const modal = document.getElementById("project-modal");
  const modalBody = document.getElementById("modal-body");

  let content = project.content;
  if (project.isMarkdown) {
    content = window.marked ? marked.parse(content) : content;
  }

  modalBody.innerHTML = `
        <h1>${project.filename.replace(/-/g, " ")}</h1>
        <p><em>Started: ${new Date(project.frontmatter.start_date).toLocaleDateString()}</em></p>
        ${
          project.frontmatter.end_date
            ? `<p><em>Completed: ${new Date(project.frontmatter.end_date).toLocaleDateString()}</em></p>`
            : "<p><em>Status: Ongoing</em></p>"
        }
        <hr style="margin: 1rem 0; border: 1px solid var(--gruvbox-bg3);">
        ${content}
    `;

  modal.classList.add("show");

  // Update URL
  window.location.hash = `portfolio/${encodeURIComponent(project.filename)}`;
}

function setupModal() {
  const modal = document.getElementById("project-modal");
  const closeBtn = document.querySelector(".close-modal");

  closeBtn.addEventListener("click", () => {
    modal.classList.remove("show");
    history.pushState(null, "", window.location.pathname);
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("show");
      history.pushState(null, "", window.location.pathname);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("show")) {
      modal.classList.remove("show");
      history.pushState(null, "", window.location.pathname);
    }
  });
}

