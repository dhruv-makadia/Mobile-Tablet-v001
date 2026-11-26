TraXtion ReCapture — Mobile & Tablet Mockup (v001)

WHAT THIS IS
Interactive mockup, in plain HTML, CSS and JavaScript, of the two ReCapture
screens for the TraXtion mobile app:
  - Follow-Up List
  - Opportunity Detail
Phone and tablet users get both screens. The design follows the look of the
existing TraXtion mobile app and the behaviour of web mockup v007.

HOW TO OPEN
1. Keep the whole folder together. index.html needs the assets folder and the
   .js and .css files next to it. If you received a ZIP file, extract it first.
2. Double-click index.html. Chrome, Edge and Safari are supported.
   - On a computer, it opens the device simulator.
   - On a phone or tablet, it opens the app full screen.
     (To see the simulator on a tablet, add ?shell to the address.)

SIMULATOR CONTROLS
  Device        Phone, Tablet, or Both side by side      keys P / T / B
  Rotate        Portrait or landscape                    key R
  Screen        Follow-Up List / Opportunity Detail      keys L / D
  Scenario      Daniel Ruiz with red rear Tires or all-green Tires
  Fit / 100%    Fit the devices to the window, or show them at actual size
  Reset         Reload with the original sample data
  Design notes  What to try on each screen, where each web column went,
                and open questions for review              key N
  Full screen   Opens app.html on its own. Resize the browser window to see
                the phone, tablet, and side-by-side layouts.

Inside a device, scroll with the mouse wheel or drag like a finger.
Tap any card, icon, chip, or button.

LAYOUTS
  Phone (narrower than 600 px)
    Card list. Opportunity Detail opens as its own screen with a bottom
    action bar for Call, SMS, Email, Note, and Follow-Up Date.
  Tablet portrait (600 to 1023 px)
    Two-column card list. Opportunity Detail opens full screen with the
    Actions card and quick actions in the sticky Vehicle Owner header.
  Tablet landscape (1024 px and wider)
    Follow-Up List and Opportunity Detail side by side.

GOOD TO KNOW
  - All names and contact details are fictional and match web mockup v007.
    Nothing connects to a TraXtion server.
  - Changes you make (SMS sent, Notes added, dates changed, Follow-Ups closed)
    last until you reload the page or press Reset.
  - Send SMS, Send Email, Make Call, Follow-Up Notes, and Share Quote are
    simplified versions of the web popups, included so the whole flow can be
    tried. Their full design is still a separate piece of work.
  - The IBM Plex Sans fonts and the logo come from the TraXtion mobile app.

FILES
  index.html          Device simulator. Start here.
  app.html            The app mockup. It also works on its own.
  app.css, app.js     App styles and behaviour
  data.js             Sample data
  shell.css, shell.js Simulator styles and behaviour
  assets/             Fonts and images
