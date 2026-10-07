import { Link } from 'react-router';
import { BRAND_NAME, supportMailto } from '@/config/brand';
import { ABOUT_PATH } from '@/config/aboutPath';
import styles from './SiteFooter.module.css';

const CONTACT_SUBJECT = 'Hello from the footer';

/**
 * The simple footer under every page in the app shell (after the footer of
 * docs/design/screens/app/S7-*): © and brand on one side, About and Contact on
 * the other. The design's Privacy and Terms links are left out because those
 * pages do not exist (REQ-014).
 */
export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.copyright}>
          © {new Date().getFullYear()} {BRAND_NAME}
        </p>
        <nav aria-label="Footer" className={styles.links}>
          <Link to={ABOUT_PATH} className={styles.link}>
            About
          </Link>
          <a href={supportMailto(CONTACT_SUBJECT)} className={styles.link}>
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
