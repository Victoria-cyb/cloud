document.addEventListener('DOMContentLoaded', () => {
  // GraphQL client setup
  const graphqlRequest = async (query, variables) => {
    console.log('Sending GraphQL request:', { query, variables });
    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: JSON.stringify({ query, variables }),
    });
    const { data, errors } = await response.json();
    if (errors) {
      console.error('GraphQL errors:', errors);
      throw new Error(errors[0].message);
    }
    return data;
  };

  // Hamburger menu functionality
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navMenu.classList.toggle('active');
    });
  }

  // Toggle auth links based on login status
  const signinLink = document.getElementById('signin-link');
  const signupLink = document.getElementById('signup-link');
  const logoutLink = document.getElementById('logout-link');
  const token = localStorage.getItem('token');
  if (token) {
    if (signinLink) signinLink.style.display = 'none';
    if (signupLink) signupLink.style.display = 'none';
    if (logoutLink) logoutLink.style.display = 'inline-block';
  } else {
    if (signinLink) signinLink.style.display = 'inline-block';
    if (signupLink) signupLink.style.display = 'inline-block';
    if (logoutLink) logoutLink.style.display = 'none';
  }

  // Logout functionality
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Logging out');
      localStorage.removeItem('token');
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.disableAutoSelect();
        console.log('Google Sign-In session revoked');
      }
      window.location.href = 'login.html';
    });
  }

  // Password toggle function
  window.togglePassword = (inputId) => {
    const input = document.getElementById(inputId);
    const toggle = input.nextElementSibling;
    if (input.type === 'password') {
      input.type = 'text';
      toggle.textContent = '🙈'; // Eye closed
      console.log(`Password shown for input: ${inputId}`);
    } else {
      input.type = 'password';
      toggle.textContent = '👁️'; // Eye open
      console.log(`Password hidden for input: ${inputId}`);
    }
  };

  // Form submission handlers
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const resultDiv = document.getElementById('result');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('signupPassword').value;

      if (password.length < 10) {
        resultDiv.textContent = 'Password must be at least 10 characters';
        resultDiv.style.color = 'red';
        return;
      }

      try {
        const data = await graphqlRequest(`
          mutation SignIn($email: String!, $password: String!) {
            signIn(email: $email, password: $password) {
              token
            }
          }
        `, { email, password });
        localStorage.setItem('token', data.signIn.token);
        resultDiv.textContent = `Logging in with ${email}`;
        resultDiv.style.color = 'green';
        console.log('JWT stored:', data.signIn.token);
        setTimeout(() => {
          window.location.href = 'body.html';
        }, 1000);
      } catch (error) {
        console.error('SignIn error:', error.message);
        resultDiv.textContent = error.message;
        resultDiv.style.color = 'red';
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const firstName = document.getElementById('signupFirstName').value;
      const lastName = document.getElementById('signupLastName').value;
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('signupPassword').value;

      if (password.length < 10) {
        resultDiv.textContent = 'Password must be at least 10 characters';
        resultDiv.style.color = 'red';
        return;
      }

      try {
        const data = await graphqlRequest(`
          mutation SignUp($firstName: String!, $lastName: String!, $email: String!, $password: String!) {
            signUp(firstName: $firstName, lastName: $lastName, email: $email, password: $password) {
              token
            }
          }
        `, { firstName, lastName, email, password });
        localStorage.setItem('token', data.signUp.token);
        resultDiv.textContent = `Signed up successfully as ${firstName} ${lastName}`;
        resultDiv.style.color = 'green';
        console.log('JWT stored:', data.signUp.token);
        setTimeout(() => {
          window.location.href = 'body.html';
        }, 1000);
      } catch (error) {
        console.error('SignUp error:', error.message);
        resultDiv.textContent = error.message;
        resultDiv.style.color = 'red';
      }
    });
  }

  // Google Sign-In
  window.handleGoogleSignIn = (response) => {
    console.log('Google Sign-In response:', response);
    try {
      if (!response.credential) {
        throw new Error('No credential received from Google');
      }
      graphqlRequest(`
        mutation GoogleSignIn($token: String!) {
          googleSignIn(token: $token) {
            token
          }
        }
      `, { token: response.credential }).then(data => {
        localStorage.setItem('token', data.googleSignIn.token);
        document.getElementById('result').textContent = 'Google Sign-In successful';
        document.getElementById('result').style.color = 'green';
        console.log('JWT stored:', data.googleSignIn.token);
        setTimeout(() => {
          window.location.href = 'body.html';
        }, 1000);
      }).catch(error => {
        console.error('GraphQL Google Sign-In error:', error.message);
        document.getElementById('result').textContent = 'Google Sign-In failed: ' + error.message;
        document.getElementById('result').style.color = 'red';
      });
    } catch (error) {
      console.error('Google Sign-In error:', error);
      document.getElementById('result').textContent = 'Google Sign-In failed: ' + error.message;
      document.getElementById('result').style.color = 'red';
    }
  };

  // Scrape Reddit button functionality
  const scrapeRedditButton = document.querySelector('.scrape[data-platform="reddit"]');
  const emailModal = document.getElementById('email-modal');
  const closeModal = document.querySelector('.close-modal');
  const emailTableBody = document.getElementById('email-table-body');
  const downloadBtn = document.querySelector('.download-btn');
  const loadingSpinner = document.getElementById('loading-spinner');
  const scrapeTable = document.getElementById('scrape-table');

  if (scrapeRedditButton) {
    console.log('Scrape Reddit button found, attaching click handler');
    scrapeRedditButton.addEventListener('click', async () => {
      console.log('Scrape Reddit button clicked');
      if (!token) {
        console.warn('No token found, redirecting to login');
        window.location.href = 'login.html';
        return;
      }
      try {
        // Show loading spinner
        if (loadingSpinner) {
          console.log('Showing loading spinner');
          loadingSpinner.style.display = 'flex';
        }
        const data = await graphqlRequest(`
          mutation {
            scrapeAndSaveRedditEmails {
              success
              message
              emails {
                email
                sourceUrl
                scrapedAt
              }
            }
          }
        `);
        console.log('Reddit scrape result:', data.scrapeAndSaveRedditEmails);

        // Hide loading spinner
        if (loadingSpinner) {
          console.log('Hiding loading spinner');
          loadingSpinner.style.display = 'none';
        }

        // Clear existing table content
        emailTableBody.innerHTML = '';

        // Populate table
        const emails = data.scrapeAndSaveRedditEmails.emails || [];
        if (emails.length === 0) {
          console.log('No emails scraped, displaying empty table');
          const row = document.createElement('tr');
          row.innerHTML = '<td colspan="3">No emails found</td>';
          emailTableBody.appendChild(row);
        } else {
          emails.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${item.email}</td>
              <td>Reddit</td>
              <td>${new Date(item.scrapedAt).toLocaleString()}</td>
            `;
            emailTableBody.appendChild(row);
          });
        }

        // Update scrape table
        if (scrapeTable) {
          const row = document.createElement('div');
          row.className = 'table-row';
          row.innerHTML = `
            <div>Reddit</div>
            <div>Email scrape</div>
            <div>${new Date().toLocaleString()}</div>
            <div>${emails.length} emails</div>
            <div>${data.scrapeAndSaveRedditEmails.success ? 'Completed' : 'Failed'}</div>
          `;
          scrapeTable.appendChild(row);
        }

        // Show modal
        emailModal.style.display = 'block';

        // Show success/failure message
        alert(data.scrapeAndSaveRedditEmails.message);
      } catch (error) {
        console.error('Error scraping Reddit emails:', error.message);
        if (loadingSpinner) {
          console.log('Hiding loading spinner due to error');
          loadingSpinner.style.display = 'none';
        }
        alert('Failed to scrape Reddit emails: ' + error.message);
      }
    });
  } else {
    console.warn('Scrape Reddit button not found');
  }

  // Handle Scraping Results click
  const resultsItem = document.querySelector('.scrape[data-platform="results"]');
  if (resultsItem && emailModal && emailTableBody && scrapeTable) {
    resultsItem.addEventListener('click', async () => {
      console.log('Scraping Results button clicked');
      if (!token) {
        console.warn('No token found, redirecting to login');
        window.location.href = 'login.html';
        return;
      }
      try {
        // Show loading spinner
        if (loadingSpinner) {
          console.log('Showing loading spinner');
          loadingSpinner.style.display = 'flex';
        }
        const data = await graphqlRequest(`
          query {
            getAllEmails {
              email
              sourceUrl
              scrapedAt
            }
          }
        `);
        console.log('All emails fetched:', data.getAllEmails);

        // Hide loading spinner
        if (loadingSpinner) {
          console.log('Hiding loading spinner');
          loadingSpinner.style.display = 'none';
        }

        // // Clear existing table content
        // emailTableBody.innerHTML = '';
        // scrapeTable.innerHTML = `
        //   <div class="hea">
        //     <p>Platforms</p>
        //     <p>Search</p>
        //     <p>Date</p>
        //     <p>Result</p>
        //     <p>Status</p>
        //   </div>
        // `;

        // Group emails by platform for scrape table
        const platformGroups = {};
        data.getAllEmails.forEach(email => {
          const platform = email.sourceUrl || 'Unknown';
          if (!platformGroups[platform]) {
            platformGroups[platform] = [];
          }
          platformGroups[platform].push(email);
        });

        // Populate scrape table
        Object.keys(platformGroups).forEach(platform => {
          const emails = platformGroups[platform];
          const latestDate = new Date(Math.max(...emails.map(e => new Date(e.scrapedAt))));
          const row = document.createElement('div');
          row.className = 'table-row';
          row.innerHTML = `
            <div>${platform}</div>
            <div>Email scrape</div>
            <div>${latestDate.toLocaleString()}</div>
            <div>${emails.length} emails</div>
            <div>Completed</div>
          `;
          scrapeTable.appendChild(row);
        });

        // Populate email modal table
        if (data.getAllEmails.length === 0) {
          console.log('No emails found, displaying empty table');
          const row = document.createElement('tr');
          row.innerHTML = '<td colspan="3">No emails found</td>';
          emailTableBody.appendChild(row);
        } else {
          data.getAllEmails.forEach(email => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${email.email}</td>
              <td>${email.sourceUrl}</td>
              <td>${new Date(email.scrapedAt).toLocaleString()}</td>
            `;
            emailTableBody.appendChild(row);
          });
        }

        // Show modal
        emailModal.style.display = 'block';
      } catch (error) {
        console.error('Error fetching all emails:', error.message);
        if (loadingSpinner) {
          console.log('Hiding loading spinner due to error');
          loadingSpinner.style.display = 'none';
        }
        alert('Failed to fetch emails: ' + error.message);
      }
    });
  } else {
    console.warn('Scraping Results button, modal, or table not found');
  }

  // Close modal
  if (closeModal) {
    closeModal.addEventListener('click', () => {
      console.log('Closing modal');
      emailModal.style.display = 'none';
    });
  }

  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === emailModal) {
      console.log('Closing modal via outside click');
      emailModal.style.display = 'none';
    }
  });

  // Download as CSV
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      console.log('Download CSV button clicked');
      try {
        const rows = [['Email', 'Platform', 'Date Collected']];
        const tableRows = emailTableBody.querySelectorAll('tr');
        if (tableRows.length === 0 || tableRows[0].textContent.includes('No emails found')) {
          console.log('No email data to download, including headers only');
        } else {
          tableRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            rows.push([
              cells[0].textContent,
              cells[1].textContent,
              cells[2].textContent
            ]);
          });
          console.log('CSV data prepared:', rows);
        }

        const csvContent = 'data:text/csv;charset=utf-8,' 
          + rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'scraped_emails.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('CSV download initiated for scraped_emails.csv');
      } catch (error) {
        console.error('CSV download error:', error);
        alert('Failed to download CSV: ' + error.message);
      }
    });
  } else {
    console.warn('Download button not found');
  }

 
  // Populate scrape table on initial load
  if (scrapeTable) {
    mockData.forEach(item => {
      const row = document.createElement('div');
      row.className = 'table-row';
      row.innerHTML = `
        <div data-label="Platform">${item.platform}</div>
        <div data-label="Search">${item.search}</div>
        <div data-label="Date">${item.date}</div>
        <div data-label="Result">${item.result}</div>
        <div data-label="Status">${item.status}</div>
      `;
      scrapeTable.appendChild(row);
    });
  }

  // Scrape item click handler for other platforms
  const scrapeItems = document.querySelectorAll('.scrape:not([data-platform="results"]):not([data-platform="reddit"])');
  scrapeItems.forEach(item => {
    item.addEventListener('click', async () => {
      const platform = item.dataset.platform;
      try {
        // Add other platform scraping logic here
        alert(`Initiating scrape for ${platform}`);
      } catch (error) {
        alert(`Error scraping ${platform}: ${error.message}`);
      }
    });
  });
});