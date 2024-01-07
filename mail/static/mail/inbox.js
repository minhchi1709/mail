document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Define recipient, subject, body, submit button, form and sender

  // Send email
  document.querySelector('#compose-form').addEventListener('submit', () => {
    const recipient = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;
    send_email(recipient, subject, body);
  });
  // By default, load the inbox
  load_mailbox('inbox');
});

function send_email(recipient, subject, body){
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipient,
      subject: subject,
      body: body 
    })
  })
  .then(response => response.json())
  .then(result => {
    console.log(result);
    return result;
  });
}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#inbox-view').style.display = 'none';
  document.querySelector('#sent-view').style.display = 'none';
  document.querySelector('#archive-view').style.display = 'none';

  // Enable subject field
  document.querySelector('#compose-subject').disabled = false;
  document.querySelector('#compose-recipients').disabled = false;

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  const inbox = document.querySelector('#inbox-view');
  const sent = document.querySelector('#sent-view');
  const archive = document.querySelector('#archive-view');
  const e = document.querySelector('#email');
  const modes = {
    'inbox': inbox,
    'sent': sent,
    'archive': archive,
    'modes': ['inbox', 'sent', 'archive'],
  };

    // Clear the content of the modes
    inbox.innerHTML = ' ';
    sent.innerHTML = ' ';
    archive.innerHTML = ' ';
    e.innerHTML = '';

    // load the corresponding content
    fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(result => result.forEach(mail => {      
      // Create a new button contains the email with corresponding id
      let n = document.createElement('button');
      n.id = mail.id;
      // Set style
      n.style.border = '1px solid black';
      n.style.marginTop = '10px';
      n.style.padding = '5px 5px 5px 5px';
      n.style.borderRadius = '8px';
      n.style.width = '100%';

      n.classList.add('btn');
      n.classList.add('text-left');
      
      // change background color based on read
      if (mail.read) {
        n.classList.add('btn-secondary');
      } else {
        n.classList.add('btn-light');
      }

      // Add content of email
      if (mailbox === 'sent') {
        n.innerHTML = `
        To: ${mail.recipients}<br>
        Subject: ${mail.subject}<br>
        Time: ${mail.timestamp}`;
      } else {
        n.innerHTML = `
        From: ${mail.sender}<br>
        Subject: ${mail.subject}<br>
        Timestamp: ${mail.timestamp}`;
      }

      // add event when user clicks
      n.addEventListener('click', () => {
        e.style.display = 'block';
        fetch(`/emails/${mail.id}`)
        .then(response => response.json())
        .then(email => {
          e.value = email.id;
          e.innerHTML = `
          <div style="margin-bottom: 20px;">
          <strong>From:</strong> ${email.sender}<br>
          <strong>To:</strong> ${email.recipients}<br>
          <strong>Subject:</strong> ${email.subject}<br>
          <strong>Timestamp:</strong> ${email.timestamp}
          </div>
          <button class="btn btn-primary" id="reply" style="margin-right: 10px;">Reply</button>`
          // Add corresponding button if the mailbox is not sent
          if (mailbox !== 'sent') {
            if (email.archived) {
              e.innerHTML += `<button class="btn btn-primary" id="unarchive">Unarchive</button>`;
            } else {
              e.innerHTML += `<button class="btn btn-primary" id="archive">Archive</button>`;
            }
          }
          e.innerHTML += `<hr>
          <div style="margin-top: 20px;">
          ${email.body}
          </div>`;
          inbox.innerHTML = '';
          sent.innerHTML = '';
          archive.innerHTML = '';
          document.querySelector('#emails-view').style.display = 'none';
          // mark email as read
          fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              read: true
            })
          })
          // add event to archive button
          if (mailbox !== 'sent') {
            if (email.archived) {
              e.querySelector(`#unarchive`).addEventListener('click', () => {
                  fetch(`/emails/${email.id}`, {
                  method: 'PUT',
                  body: JSON.stringify({
                    archived: false
                  })
                })
                // load inbox
                load_mailbox('inbox');
              });
            } else {
                e.querySelector(`#archive`).addEventListener('click', () => {
                    fetch(`/emails/${email.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                      archived: true
                    })
                  })
                  // load inbox
                  load_mailbox('inbox');
                });
              }
          }
            // add event to reply button
          e.querySelector('#reply').addEventListener('click', () => {
            let subject = email.subject;
            if (!subject.includes('Re:')) {
                subject = `Re: ${subject}`;
            }
            let recipient = email.sender;
            let body = email.body;
            let timestamp = email.timestamp;
            document.querySelector('#compose-view').style.display = 'block';
            e.style.display = 'none';
            document.querySelector('#compose-recipients').value = recipient;
            document.querySelector('#compose-subject').value = subject;
            document.querySelector('#compose-recipients').disabled = true;
            document.querySelector('#compose-subject').disabled = true;
            document.querySelector('#compose-body').value = `On ${timestamp} ${recipient} wrote: ${body}`;
          });
          });
      });
      // append the button to corresponding outer div 
      modes[mailbox].appendChild(n);
      }));
}
