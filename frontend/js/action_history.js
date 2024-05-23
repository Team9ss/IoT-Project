// Add an event listener to execute the function when the DOM content is fully loaded
document.addEventListener("DOMContentLoaded", function () {
  // Initialize variables for sorting direction, sorting field, current page, keyword, and search field
  let sortDirection = "asc";
  let sortField = "id";
  let currentPage = 1; 
  let keyword = "";
  let searchField = "all"; 

  // Add click event listeners to all elements with the class 'sortable'
  document.querySelectorAll(".sortable").forEach((th) => {
    th.addEventListener("click", () => {
      // Update the sort field based on the clicked column's data-field attribute
      sortField = th.dataset.field;
      // Toggle the sorting direction between ascending and descending
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
      // Fetch and display data for the current page with the new sorting parameters
      getDataForPage(currentPage);
    });
  });

  // Function to format date-time strings into a specific format
  function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    // Return the formatted date-time string
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  // Function to display data in the table
  function displayData(data) {
    const tableBody = document.querySelector("#dataTable tbody");
    tableBody.innerHTML = ""; // Clear the existing table body content

    data.forEach((row) => {
      const newRow = document.createElement("tr"); // Create a new table row element
      // Set the inner HTML of the row with data from the current row
      newRow.innerHTML = `
        <td>${row.id}</td>
        <td>${row.Device.toUpperCase()}</td>
        <td>${row.action}</td>
        <td>${formatDateTime(row.created_at)}</td>
      `;
      // Append the new row to the table body
      tableBody.appendChild(newRow);
    });
  }

  // Function to fetch data for a specific page
  function getDataForPage(page, pageSize) {
    const sortBy = sortDirection; // Use the current sort direction
    keyword = document.getElementById("searchInput").value; // Get the current keyword from the search input
    searchField = document.getElementById("searchCategory").value; // Get the current search field from the search category select element

    // Fetch data from the server using the specified parameters
    fetch(
      `http://localhost:2002/action_history?page=${page}&pageSize=${pageSize}&sortField=${sortField}&sortBy=${sortBy}&keyword=${keyword}&searchField=${searchField}`
    )
      .then((response) => response.json()) // Parse the response as JSON
      .then((data) => {
        displayData(data.data); // Display the fetched data in the table
        updatePagination(data.pagination); // Update the pagination controls
        currentPage = page; // Update the current page variable
      })
      .catch((error) => console.error("Error:", error)); // Log any errors to the console
  }

  // Add a click event listener to the search button
  const searchButton = document.getElementById("searchButton");
  searchButton.addEventListener("click", function () {
    // Fetch and display data for the first page with the search parameters
    getDataForPage(1, 10);
  });

  // Get the pagination container element
  const paginationContainer = document.querySelector(".pagination");

  // Function to update the pagination controls
  function updatePagination(pagination) {
    paginationContainer.innerHTML = ""; // Clear the existing pagination content

    const { currentPage, totalPages } = pagination; // Destructure the current page and total pages from the pagination object
    const maxVisiblePages = 5; // Maximum number of visible page links

    // Calculate the start and end pages for the pagination links
    let startPage = currentPage - Math.floor(maxVisiblePages / 2);
    startPage = Math.max(startPage, 1);
    let endPage = startPage + maxVisiblePages - 1;
    endPage = Math.min(endPage, totalPages);

    // Create and append page links for the calculated range
    for (let i = startPage; i <= endPage; i++) {
      const pageLink = document.createElement("a");
      pageLink.href = "#";
      pageLink.textContent = i;
      if (i === currentPage) {
        pageLink.classList.add("active"); // Highlight the current page link
      }
      pageLink.addEventListener("click", () => {
        getDataForPage(i, 10); // Fetch and display data for the clicked page
      });
      paginationContainer.appendChild(pageLink);
    }

    // Add a "Prev" link if there are previous pages
    if (startPage > 1) {
      const prevLink = document.createElement("a");
      prevLink.href = "#";
      prevLink.textContent = "Prev";
      prevLink.addEventListener("click", () => {
        getDataForPage(currentPage - 1, 10); // Fetch and display data for the previous page
      });
      paginationContainer.prepend(prevLink);
    }

    // Add a "Next" link if there are more pages
    if (endPage < totalPages) {
      const nextLink = document.createElement("a");
      nextLink.href = "#";
      nextLink.textContent = "Next";
      nextLink.addEventListener("click", () => {
        getDataForPage(currentPage + 1, 10); // Fetch and display data for the next page
      });
      paginationContainer.appendChild(nextLink);
    }
  }

  // Initial fetch and display of data for the first page
  getDataForPage(1, 10);
});
