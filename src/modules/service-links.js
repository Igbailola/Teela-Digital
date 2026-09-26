/* ============================================================
   SERVICE LINKS
   When user clicks "Explore service ↗", smoothly scrolls to #contact
   and preselects the corresponding service in the project type dropdown.
   ============================================================ */

export function initServiceLinks() {
  const serviceLinks = document.querySelectorAll('.service-card__link');
  const projectTypeSelect = document.getElementById('contact-project-type');

  serviceLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const serviceType = link.dataset.serviceSelect;
      if (serviceType && projectTypeSelect) {
        projectTypeSelect.value = serviceType;
      }
    });
  });
}
