-- Bolt 20: demo seed data. Resets users/posts/comments to a known demo set.
-- Re-runnable: run it again at any time to restore exactly this data.
--   psql -h <host> -p <port> -U <user> -d <db> -v ON_ERROR_STOP=1 -f db/seed/seed_demo_data.sql
-- Requires migrations 001–003.
--
-- Deletes EVERY user except munifmubtashim@gmail.com (kept, password reset to the demo password,
-- alumni row added if missing).
-- Deleting users cascades to their alumni/students rows, posts and comments.
--
-- All demo accounts (and munifmubtashim@gmail.com) use the password:  Password123!
--   admin    admin@alumni.test
--   student  nadia.rahman@alumni.test, tanvir.hossain@alumni.test, sara.islam@alumni.test
--   alumni   arif.chowdhury@alumni.test, farhana.akter@alumni.test, rakib.hasan@alumni.test,
--            maliha.karim@alumni.test, imran.ahmed@alumni.test, sabrina.sultana@alumni.test
BEGIN;

DELETE FROM users WHERE email <> 'munifmubtashim@gmail.com';

DO $$
DECLARE
    pw CONSTANT TEXT := '$2b$10$MnHzXENCkPaQ.FOpgIVUEuKc2MJ/99G7J7UYG/a..oI5EPwiASav6'; -- Password123!
    uni CONSTANT TEXT := 'University of Dhaka';
    u_admin INT; u_nadia INT; u_tanvir INT; u_sara INT;
    u_arif INT; u_farhana INT; u_rakib INT; u_maliha INT; u_imran INT; u_sabrina INT;
    p1 INT; p2 INT; p3 INT; p4 INT; p5 INT; p6 INT; p7 INT; p8 INT; p9 INT; p10 INT;
    c INT;
BEGIN
    -- Keep sequences ahead of the kept account's id.
    PERFORM setval('users_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM users), 1), (SELECT COUNT(*) > 0 FROM users));
    PERFORM setval('posts_id_seq', 1, false);
    PERFORM setval('comments_id_seq', 1, false);
    PERFORM setval('students_id_seq', 1, false);
    PERFORM setval(pg_get_serial_sequence('alumni', 'id'), GREATEST((SELECT COALESCE(MAX(id), 0) FROM alumni), 1), (SELECT COUNT(*) > 0 FROM alumni));

    -- ---------- Users ----------
    INSERT INTO users (name, email, password, role, university, photo_url)
    VALUES ('Admin Office', 'admin@alumni.test', pw, 'admin', uni, NULL) RETURNING id INTO u_admin;

    INSERT INTO users (name, email, password, role, university, photo_url)
    VALUES ('Nadia Rahman', 'nadia.rahman@alumni.test', pw, 'student', uni, 'https://i.pravatar.cc/150?img=47') RETURNING id INTO u_nadia;
    INSERT INTO users (name, email, password, role, university, photo_url)
    VALUES ('Tanvir Hossain', 'tanvir.hossain@alumni.test', pw, 'student', uni, 'https://i.pravatar.cc/150?img=12') RETURNING id INTO u_tanvir;
    INSERT INTO users (name, email, password, role, university, photo_url)
    VALUES ('Sara Islam', 'sara.islam@alumni.test', pw, 'student', 'BRAC University', 'https://i.pravatar.cc/150?img=45') RETURNING id INTO u_sara;

    INSERT INTO users (name, email, password, role, university, photo_url)
    VALUES ('Arif Chowdhury', 'arif.chowdhury@alumni.test', pw, 'alumni', uni, 'https://i.pravatar.cc/150?img=33') RETURNING id INTO u_arif;
    INSERT INTO users (name, email, password, role, university, photo_url)
    VALUES ('Farhana Akter', 'farhana.akter@alumni.test', pw, 'alumni', uni, 'https://i.pravatar.cc/150?img=44') RETURNING id INTO u_farhana;
    INSERT INTO users (name, email, password, role, university, photo_url)
    VALUES ('Rakib Hasan', 'rakib.hasan@alumni.test', pw, 'alumni', 'BUET', 'https://i.pravatar.cc/150?img=15') RETURNING id INTO u_rakib;
    INSERT INTO users (name, email, password, role, university, photo_url)
    VALUES ('Maliha Karim', 'maliha.karim@alumni.test', pw, 'alumni', 'BRAC University', 'https://i.pravatar.cc/150?img=49') RETURNING id INTO u_maliha;
    INSERT INTO users (name, email, password, role, university, photo_url)
    VALUES ('Imran Ahmed', 'imran.ahmed@alumni.test', pw, 'alumni', 'North South University', 'https://i.pravatar.cc/150?img=59') RETURNING id INTO u_imran;
    INSERT INTO users (name, email, password, role, university, photo_url)
    VALUES ('Sabrina Sultana', 'sabrina.sultana@alumni.test', pw, 'alumni', uni, 'https://i.pravatar.cc/150?img=32') RETURNING id INTO u_sabrina;

    -- ---------- Student profiles ----------
    INSERT INTO students (user_id, department, expected_graduation_year, current_company, job_title, bio, linkedin_url) VALUES
        (u_nadia,  'Computer Science and Engineering', '2027', NULL, NULL,
         'Third-year CSE student interested in machine learning and open source.', 'https://www.linkedin.com/in/nadia-rahman-demo'),
        (u_tanvir, 'Electrical and Electronic Engineering', '2028', NULL, NULL,
         'Robotics club member. Looking for mentors in embedded systems.', NULL),
        (u_sara,   'Business Administration', '2026', 'Grameenphone', 'Marketing Intern',
         'Final-year BBA student, currently interning in digital marketing.', 'https://www.linkedin.com/in/sara-islam-demo');

    -- ---------- Alumni profiles ----------
    INSERT INTO alumni (user_id, department, graduation_year, current_company, job_title, experience, bio, linkedin_url) VALUES
        (u_arif,    'Computer Science and Engineering', 2015, 'Google', 'Senior Software Engineer',
         '8 years in backend and distributed systems. Previously at Pathao and Samsung R&D.',
         'Happy to review CVs and do mock interviews for CSE students.', 'https://www.linkedin.com/in/arif-chowdhury-demo'),
        (u_farhana, 'Economics', 2012, 'World Bank', 'Economist',
         'Development economics, poverty and labour-market research across South Asia.',
         'Mentor for students interested in policy and research careers.', 'https://www.linkedin.com/in/farhana-akter-demo'),
        (u_rakib,   'Civil Engineering', 2010, 'Arup', 'Structural Engineer',
         'Bridges and high-rise structures; worked on the Padma Bridge approach roads.',
         'Civil engineer based in Dhaka.', NULL),
        (u_maliha,  'Business Administration', 2018, 'Unilever Bangladesh', 'Brand Manager',
         'FMCG brand management, consumer insights and campaign planning.',
         'Always up for a coffee chat about marketing careers.', 'https://www.linkedin.com/in/maliha-karim-demo'),
        (u_imran,   'Computer Science and Engineering', 2019, 'bKash', 'Data Scientist',
         'Fraud detection models and analytics platforms for mobile financial services.',
         'Data science, Python and a lot of SQL.', 'https://www.linkedin.com/in/imran-ahmed-demo'),
        (u_sabrina, 'Pharmacy', 2016, 'Square Pharmaceuticals', 'Quality Assurance Manager',
         'GMP compliance and QA for oral solid dosage manufacturing.',
         'Pharmacy alumna; glad to help with industry placements.', NULL);

    -- Kept account: same demo password, and an alumni row so it appears in the directory.
    UPDATE users SET password = pw, updated_at = NOW() WHERE email = 'munifmubtashim@gmail.com';
    INSERT INTO alumni (user_id)
    SELECT id FROM users WHERE email = 'munifmubtashim@gmail.com'
    ON CONFLICT (user_id) DO NOTHING;

    -- ---------- Posts ----------
    INSERT INTO posts (user_id, caption, created_at) VALUES (u_admin,
        'Welcome to the Alumni Network! Update your profile so classmates and students can find you.', NOW() - INTERVAL '10 days') RETURNING id INTO p1;
    INSERT INTO posts (user_id, caption, created_at) VALUES (u_arif,
        'Google is hiring new-grad software engineers. Happy to refer CSE students and alumni — send me your CV.', NOW() - INTERVAL '9 days') RETURNING id INTO p2;
    INSERT INTO posts (user_id, caption, created_at) VALUES (u_nadia,
        'Looking for a mentor in machine learning for my final-year thesis. Any alumni working in ML?', NOW() - INTERVAL '8 days') RETURNING id INTO p3;
    INSERT INTO posts (user_id, caption, created_at) VALUES (u_farhana,
        'Sharing a few slots for research assistant positions on a labour-market study this winter.', NOW() - INTERVAL '7 days') RETURNING id INTO p4;
    INSERT INTO posts (user_id, caption, media_url, created_at) VALUES (u_rakib,
        'Throwback to our 2010 batch field trip. Who remembers this?', 'https://picsum.photos/seed/alumni-trip/800/450', NOW() - INTERVAL '6 days') RETURNING id INTO p5;
    INSERT INTO posts (user_id, caption, created_at) VALUES (u_tanvir,
        'Our robotics team made it to the national finals! Thanks to everyone who helped us prepare.', NOW() - INTERVAL '5 days') RETURNING id INTO p6;
    INSERT INTO posts (user_id, caption, created_at) VALUES (u_maliha,
        'Unilever''s Future Leaders Programme applications are open. Ask me anything about the process.', NOW() - INTERVAL '4 days') RETURNING id INTO p7;
    INSERT INTO posts (user_id, caption, created_at) VALUES (u_imran,
        'Running a free SQL + Python workshop for students next Saturday. Comment if you want to join.', NOW() - INTERVAL '3 days') RETURNING id INTO p8;
    INSERT INTO posts (user_id, caption, created_at) VALUES (u_sara,
        'Just started my marketing internship at Grameenphone. Any tips for making the most of it?', NOW() - INTERVAL '2 days') RETURNING id INTO p9;
    INSERT INTO posts (user_id, caption, created_at) VALUES (u_sabrina,
        'Square Pharma is taking pharmacy interns for the summer. DM me for details.', NOW() - INTERVAL '1 day') RETURNING id INTO p10;

    -- ---------- Comments (replies use parent_id, one level deep) ----------
    INSERT INTO comments (user_id, post_id, content, created_at) VALUES
        (u_arif,    p1, 'Great to see this platform live!', NOW() - INTERVAL '10 days' + INTERVAL '2 hours'),
        (u_nadia,   p1, 'Profile updated. Thanks!',          NOW() - INTERVAL '10 days' + INTERVAL '5 hours');

    INSERT INTO comments (user_id, post_id, content, created_at)
    VALUES (u_nadia, p2, 'I''d love a referral! Sending my CV now.', NOW() - INTERVAL '9 days' + INTERVAL '1 hour') RETURNING id INTO c;
    INSERT INTO comments (user_id, post_id, parent_id, content, created_at) VALUES
        (u_arif,  p2, c, 'Got it, Nadia. I''ll take a look this week.', NOW() - INTERVAL '9 days' + INTERVAL '3 hours');
    INSERT INTO comments (user_id, post_id, content, created_at) VALUES
        (u_imran, p2, 'Great opportunity, sharing with my juniors.', NOW() - INTERVAL '9 days' + INTERVAL '6 hours');

    INSERT INTO comments (user_id, post_id, content, created_at)
    VALUES (u_imran, p3, 'I work on ML at bKash. Happy to help — what''s your thesis topic?', NOW() - INTERVAL '8 days' + INTERVAL '2 hours') RETURNING id INTO c;
    INSERT INTO comments (user_id, post_id, parent_id, content, created_at) VALUES
        (u_nadia, p3, c, 'Fraud detection on transaction data! That''s a perfect match.', NOW() - INTERVAL '8 days' + INTERVAL '4 hours');
    INSERT INTO comments (user_id, post_id, content, created_at) VALUES
        (u_arif,  p3, 'Also happy to help with the systems side.', NOW() - INTERVAL '8 days' + INTERVAL '8 hours');

    INSERT INTO comments (user_id, post_id, content, created_at) VALUES
        (u_sara,  p4, 'Is this open to business students too?', NOW() - INTERVAL '7 days' + INTERVAL '3 hours');

    INSERT INTO comments (user_id, post_id, content, created_at)
    VALUES (u_sabrina, p5, 'Haha, I remember the bus breaking down on the way back!', NOW() - INTERVAL '6 days' + INTERVAL '1 hour') RETURNING id INTO c;
    INSERT INTO comments (user_id, post_id, parent_id, content, created_at) VALUES
        (u_rakib, p5, c, 'Best part of the trip honestly.', NOW() - INTERVAL '6 days' + INTERVAL '2 hours');

    INSERT INTO comments (user_id, post_id, content, created_at) VALUES
        (u_admin,  p6, 'Congratulations to the team! We''ll feature this in the newsletter.', NOW() - INTERVAL '5 days' + INTERVAL '2 hours'),
        (u_arif,   p6, 'Well done, Tanvir!',                                              NOW() - INTERVAL '5 days' + INTERVAL '4 hours'),
        (u_nadia,  p6, 'So proud of you all!',                                            NOW() - INTERVAL '5 days' + INTERVAL '6 hours');

    INSERT INTO comments (user_id, post_id, content, created_at)
    VALUES (u_sara, p7, 'What does the assessment centre look like?', NOW() - INTERVAL '4 days' + INTERVAL '1 hour') RETURNING id INTO c;
    INSERT INTO comments (user_id, post_id, parent_id, content, created_at) VALUES
        (u_maliha, p7, c, 'A case study, a group exercise and a final interview. Prepare a recent campaign you liked!', NOW() - INTERVAL '4 days' + INTERVAL '3 hours');

    INSERT INTO comments (user_id, post_id, content, created_at) VALUES
        (u_tanvir, p8, 'Count me in!',                              NOW() - INTERVAL '3 days' + INTERVAL '1 hour'),
        (u_nadia,  p8, 'Me too. Will it be recorded?',              NOW() - INTERVAL '3 days' + INTERVAL '2 hours'),
        (u_admin,  p8, 'We can host it in the alumni hall — I''ll book the room.', NOW() - INTERVAL '3 days' + INTERVAL '5 hours');

    INSERT INTO comments (user_id, post_id, content, created_at) VALUES
        (u_maliha, p9, 'Ask for feedback early and often. Good luck, Sara!', NOW() - INTERVAL '2 days' + INTERVAL '2 hours');

    INSERT INTO comments (user_id, post_id, content, created_at) VALUES
        (u_farhana, p10, 'Sharing with my cousin who''s in pharmacy, thanks!', NOW() - INTERVAL '1 day' + INTERVAL '3 hours');

    UPDATE comments SET updated_at = created_at;
    UPDATE posts SET updated_at = created_at;
END $$;

-- comment_count includes replies (same rule as the API).
UPDATE posts p SET comment_count = (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id);

COMMIT;
