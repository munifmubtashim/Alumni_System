INSERT INTO alumni_profile (user_id, department, graduation_yr, current_company, job_title, experience, bio, linkedin_url)
VALUES (15, 'CSE', 2023, 'Google', 'Engineer', '5 years', 'I am an alumni', 'https://linkedin.com/in/alumni')
RETURNING *;