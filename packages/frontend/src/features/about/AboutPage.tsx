import { useId } from 'react';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { BRAND_NAME } from '@/config/brand';
import styles from './AboutPage.module.css';

interface Step {
  title: string;
  text: string;
}

interface Benefit {
  title: string;
  text: string;
}

/**
 * Every line describes something the app does today (profile with a mentoring
 * switch, directory search, the feed). No counts or statistics (REQ-014 AC2);
 * add a step only when the feature exists.
 */
const STEPS: readonly Step[] = [
  {
    title: 'Create your profile',
    text: "Add your education, your current role, and whether you're open to mentoring.",
  },
  {
    title: 'Find your people',
    text: 'Search the directory by university, department, or graduation year.',
  },
  {
    title: 'Connect and share',
    text: 'Post updates, ask for advice, and offer opportunities in the feed.',
  },
];

const BENEFITS: readonly Benefit[] = [
  {
    title: 'For students',
    text: "Browse alumni in the field you want to enter, ask questions in the feed, and find mentors who've said they're open to helping.",
  },
  {
    title: 'For alumni',
    text: 'Stay connected to your university community, give back by mentoring students, and share opportunities with your network.',
  },
];

/**
 * The public About page, after docs/design/screens/app/S7-*: hero with the
 * mission line, "How it works" in three steps, and a card each for students
 * and alumni. The header and footer come from AppShell. Reachable without a
 * session, so it must not call the API.
 */
export function AboutPage() {
  const stepsId = useId();
  const benefitsId = useId();

  return (
    <div className={styles.about}>
      <section className={styles.hero}>
        <h1 className={styles.title}>
          A lifelong connection between alumni and the students who follow them.
        </h1>
        <p className={styles.lead}>
          Find mentors, share opportunities, and stay close to the community you studied with —
          wherever your career takes you next.
        </p>
      </section>

      <section aria-labelledby={stepsId} className={styles.steps}>
        <h2 id={stepsId} className={styles.heading}>
          How it works
        </h2>
        <ol className={styles.stepList}>
          {STEPS.map((step, index) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.number} aria-hidden="true">
                {index + 1}
              </span>
              <div className={styles.stepBody}>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepText}>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby={benefitsId} className={styles.benefits}>
        <VisuallyHidden as="h2" id={benefitsId}>
          Who {BRAND_NAME} is for
        </VisuallyHidden>
        {BENEFITS.map((benefit) => (
          <div key={benefit.title} className={styles.card}>
            <h3 className={styles.cardTitle}>{benefit.title}</h3>
            <p className={styles.cardText}>{benefit.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
