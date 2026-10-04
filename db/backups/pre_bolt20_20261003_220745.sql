--
-- PostgreSQL database dump
--

\restrict jABVHtFTFfNT91nwLK9KQ8huflagen8FAaPSUyOar6PC2qz9dc5c1z179vSSOHR

-- Dumped from database version 15.17 (Homebrew)
-- Dumped by pg_dump version 18.3 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alumni; Type: TABLE; Schema: public; Owner: munifmubtashim
--

CREATE TABLE public.alumni (
    id integer NOT NULL,
    user_id integer,
    department character varying(100),
    graduation_year integer,
    current_company character varying(100),
    job_title character varying(100),
    experience text,
    bio text,
    linkedin_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.alumni OWNER TO munifmubtashim;

--
-- Name: alumni_profile_id_seq; Type: SEQUENCE; Schema: public; Owner: munifmubtashim
--

CREATE SEQUENCE public.alumni_profile_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alumni_profile_id_seq OWNER TO munifmubtashim;

--
-- Name: alumni_profile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: munifmubtashim
--

ALTER SEQUENCE public.alumni_profile_id_seq OWNED BY public.alumni.id;


--
-- Name: comments; Type: TABLE; Schema: public; Owner: munifmubtashim
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    user_id integer NOT NULL,
    post_id integer NOT NULL,
    parent_id integer,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.comments OWNER TO munifmubtashim;

--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: munifmubtashim
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comments_id_seq OWNER TO munifmubtashim;

--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: munifmubtashim
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: posts; Type: TABLE; Schema: public; Owner: munifmubtashim
--

CREATE TABLE public.posts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    caption text,
    media_url text,
    comment_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.posts OWNER TO munifmubtashim;

--
-- Name: posts_id_seq; Type: SEQUENCE; Schema: public; Owner: munifmubtashim
--

CREATE SEQUENCE public.posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.posts_id_seq OWNER TO munifmubtashim;

--
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: munifmubtashim
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;


--
-- Name: students; Type: TABLE; Schema: public; Owner: munifmubtashim
--

CREATE TABLE public.students (
    id integer NOT NULL,
    user_id integer NOT NULL,
    department character varying(100),
    expected_graduation_year character varying(10),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    current_company character varying(100),
    job_title character varying(100),
    experience text,
    bio text,
    linkedin_url character varying(255)
);


ALTER TABLE public.students OWNER TO munifmubtashim;

--
-- Name: students_id_seq; Type: SEQUENCE; Schema: public; Owner: munifmubtashim
--

CREATE SEQUENCE public.students_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.students_id_seq OWNER TO munifmubtashim;

--
-- Name: students_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: munifmubtashim
--

ALTER SEQUENCE public.students_id_seq OWNED BY public.students.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: munifmubtashim
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role character varying(20),
    photo_url text,
    login_at timestamp without time zone,
    logout_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    university character varying(150)
);


ALTER TABLE public.users OWNER TO munifmubtashim;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: munifmubtashim
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO munifmubtashim;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: munifmubtashim
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: alumni id; Type: DEFAULT; Schema: public; Owner: munifmubtashim
--

ALTER TABLE ONLY public.alumni ALTER COLUMN id SET DEFAULT nextval('public.alumni_profile_id_seq'::regclass);


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: munifmubtashim
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: posts id; Type: DEFAULT; Schema: public; Owner: munifmubtashim
--

ALTER TABLE ONLY public.posts ALTER COLUMN id SET DEFAULT nextval('public.posts_id_seq'::regclass);


--
-- Name: students id; Type: DEFAULT; Schema: public; Owner: munifmubtashim
--

ALTER TABLE ONLY public.students ALTER COLUMN id SET DEFAULT nextval('public.students_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: munifmubtashim
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: alumni; Type: TABLE DATA; Schema: public; Owner: munifmubtashim
--

COPY public.alumni (id, user_id, department, graduation_year, current_company, job_title, experience, bio, linkedin_url, created_at, updated_at) FROM stdin;
8	2	CSE	2023	Google	Engineer	5 years	I am an alumni	https://linkedin.com/in/alumni	2026-06-23 04:17:51.485301	2026-06-23 04:17:51.485301
9	19	\N	\N	\N	\N	\N	\N	\N	2026-10-03 10:42:19.881915	2026-10-03 10:42:19.881915
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: munifmubtashim
--

COPY public.comments (id, user_id, post_id, parent_id, content, created_at, updated_at) FROM stdin;
16	2	2	\N	This is a great post!	2026-06-23 04:04:29.224248	2026-06-23 04:04:29.224248
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: munifmubtashim
--

COPY public.posts (id, user_id, caption, media_url, comment_count, created_at, updated_at) FROM stdin;
2	2	Caption1	upload/image2.jpg	10	2026-05-12 18:07:09.874335	2026-05-12 18:07:09.874335
3	2	Caption1	upload/image2.jpg	10	2026-05-13 21:34:09.920787	2026-05-13 21:34:09.920787
4	2	Caption1	upload/image2.jpg	10	2026-05-13 21:36:01.533454	2026-05-13 21:36:01.533454
5	2	Caption1	upload/image2.jpg	10	2026-05-13 21:37:31.644981	2026-05-13 21:37:31.644981
6	2	Caption1	upload/image2.jpg	10	2026-05-13 21:39:41.524774	2026-05-13 21:39:41.524774
7	2	Caption1	upload/image2.jpg	10	2026-05-15 23:49:25.440006	2026-05-15 23:49:25.440006
8	2	Caption1	upload/image2.jpg	10	2026-05-16 02:08:14.031491	2026-05-16 02:08:14.031491
9	2	Caption1	upload/image2.jpg	10	2026-05-16 10:58:50.608404	2026-05-16 10:58:50.608404
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: munifmubtashim
--

COPY public.students (id, user_id, department, expected_graduation_year, created_at, updated_at, current_company, job_title, experience, bio, linkedin_url) FROM stdin;
1	20	CSE	2027	2026-10-03 10:42:20.066661	2026-10-03 10:42:20.066661	\N	\N	\N	\N	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: munifmubtashim
--

COPY public.users (id, name, email, password, role, photo_url, login_at, logout_at, created_at, updated_at, university) FROM stdin;
2	Munif	munif23@gmail.com	$2a$12$uzbvw7mrHRvsj/UIXMt7Gery9kWes2.5TQelupKwqpHHHXm/n3i6G	alumni	\N	\N	\N	2026-04-24 23:46:42.016933	2026-04-24 23:46:42.016933	\N
4	Munif	munif256@gmail.com	$2b$10$U0rrcuJIshICC7.6s7DqvOhdQGRGMMZhY5880OED4YeVnHRkK94K6	alumni	\N	\N	\N	2026-04-24 23:52:03.375883	2026-04-24 23:52:03.375883	\N
18	Test User	testuser@example.com	$2b$10$1uCxFXcD84XLBvbxt86z6epsJBw0NCbLV29DkqdCKHHef9ZN/ybt2	alumni	\N	\N	\N	2026-07-25 01:00:32.650776	2026-07-25 01:00:32.650776	\N
17	mm	mm@test.com	$2b$10$f56x/.WVuI2aOASrQkEpcuqd98HgzSePKXWYIXhtYa9ZiTyJGV.u2	alumni	\N	\N	\N	2026-06-27 11:54:56.809764	2026-06-27 11:54:56.809764	\N
3	Munif	munif234@gmail.com	$2b$10$AkgiqLkZpYgsERQbDh4Jwu8yeO7weRq4trvou8rmYk80te71vgUXy	alumni	\N	\N	\N	2026-04-24 23:47:01.068079	2026-04-24 23:47:01.068079	\N
8	Munif Mubtashim	munifmubtashim@gmail.com	$2b$10$DEXMyXcquSY6e8E2HbEF1uVP0x4RduW4aO0sgBdBD9CMev9Jz8Q5W	alumni	\N	\N	\N	2026-06-19 23:42:57.644852	2026-06-19 23:42:57.644852	\N
5	Munif Mubtashim	munifmubtashim@getMaxListeners.com	$2b$10$n1nMI2cb5LLfk.BH.KVseOzAvwqOrl4o8JQ6JNAu6uZdq8qDZlmH2	admin	\N	\N	\N	2026-05-16 00:09:13.489309	2026-05-16 00:09:13.489309	\N
19	Demo Alumni	demo.alumni@test.com	$2b$10$sHgtLYZMvSZhA6Ulgu2Y4eCPpQSKBh5rw8kcrF3F4kwccxlfFJBQS	alumni	\N	\N	\N	2026-10-03 10:42:19.881915	2026-10-03 10:42:19.881915	Demo University
20	Demo Student	demo.student@test.com	$2b$10$gAOsVQ4xik2NXRxrHKFr/OTP/Yp2vL9r2s.atGD1IwjFZZEq86ePS	student	\N	\N	\N	2026-10-03 10:42:20.066661	2026-10-03 10:42:20.066661	Demo University
\.


--
-- Name: alumni_profile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: munifmubtashim
--

SELECT pg_catalog.setval('public.alumni_profile_id_seq', 9, true);


--
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: munifmubtashim
--

SELECT pg_catalog.setval('public.comments_id_seq', 16, true);


--
-- Name: posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: munifmubtashim
--

SELECT pg_catalog.setval('public.posts_id_seq', 17, true);


--
-- Name: students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: munifmubtashim
--

SELECT pg_catalog.setval('public.students_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: munifmubtashim
--

SELECT pg_catalog.setval('public.users_id_seq', 20, true);


--
-- Name: alumni alumni_profile_pkey; Type: CONSTRAINT; Schema: public; Owner: munifmubtashim
--

ALTER TABLE ONLY public.alumni
    ADD CONSTRAINT alumni_profile_pkey PRIMARY KEY (id);


--
-- Name: alumni alumni_profile_user_id_key; Type: CONSTRAINT; Schema: public; Owner: munifmubtashim
--

ALTER TABLE ONLY public.alumni
    ADD CONSTRAINT alumni_profile_user_id_key UNIQUE (user_id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: munifmubtashim
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: munifmubtashim
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: munifmubtashim
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: students students_user_id_key; Type: CONSTRAINT; Schema: public; Owner: munifmubtashim
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_user_id_key UNIQUE (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: munifmubtashim
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: munifmubtashim
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: alumni alumni_profile_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: munifmubtashim
--

ALTER TABLE ONLY public.alumni
    ADD CONSTRAINT alumni_profile_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: comments comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: munifmubtashim
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: comments comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: munifmubtashim
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: comments comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: munifmubtashim
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: posts posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: munifmubtashim
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: students students_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: munifmubtashim
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict jABVHtFTFfNT91nwLK9KQ8huflagen8FAaPSUyOar6PC2qz9dc5c1z179vSSOHR

