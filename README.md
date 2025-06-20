# Elastic Support Matrix Enhancer

A Chrome extension that supercharges the official [Elastic Support Matrix](https://www.elastic.co/support/matrix) page, making it interactive, searchable, and easier to navigate.

This extension was developed to address the challenges of finding specific compatibility information on the dense and static official support matrix. It dynamically parses the page content and presents it in a powerful, user-friendly interface.

## ✨ Features

-   **Dynamic Product Discovery**: Automatically detects all product support tables on the page (e.g., Elasticsearch, Kibana, Logstash, Auditbeat, etc.).
-   **Interactive Product Selector**: A clean, modern UI allows you to choose which product matrix you want to view.
-   **Powerful Filtering & Searching**:
    -   Instantly search for specific operating systems.
    -   Filter by product version, OS family, architecture, and support status.
-   **Clean, Modern Interface**: All data is presented in a responsive, full-screen overlay with a clear and readable table layout.
-   **At-a-Glance Statistics**: See key stats like the total number of supported OS versions, what you're currently viewing, and more.
-   **Expandable Details**: Click "View All Versions" to see a complete list of every supported version for a specific OS.

## 🚀 How to Use

1.  **Navigate to the Page**: Go to the [Elastic Support Matrix](https://www.elastic.co/support/matrix).
2.  **Click the Button**: A permanent button will appear in the top-right corner of the page labeled "✨ Click for searchable matrix view". Click it.
3.  **Select a Product**: A modal window will appear, listing all the products found on the page. Click the product you are interested in (e.g., "Kibana").
4.  **Explore the Matrix**: The enhanced interface will load with the data for your selected product. Use the search and filter controls at the top to instantly find the information you need.

## 🛠️ Local Development & Installation

To run this extension locally:

1.  **Clone the Repository**:
    ```bash
    git clone <repository-url>
    ```
2.  **Open Chrome Extensions**: Open Google Chrome and navigate to `chrome://extensions`.
3.  **Enable Developer Mode**: Toggle the "Developer mode" switch in the top-right corner.
4.  **Load Unpacked**: Click the "Load unpacked" button and select the directory where you cloned the repository.

The extension will now be installed and active.

## 📂 File Structure

-   `manifest.json`: The core configuration file for the Chrome extension. It defines permissions, content scripts, and other metadata.
-   `content.js`: The main JavaScript file that runs on the support matrix page. It handles all the logic for discovering products, parsing tables, and building the enhanced UI.
-   `styles.css`: Contains all the CSS rules for styling the enhanced interface, including the product selector, table, and filter controls.
-   `popup.html`: The HTML for the small popup that appears when you click the extension icon in the Chrome toolbar. It provides basic information and links.
