create table demo_test (
  id bigserial primary key,
  message varchar(255) not null,
  created_at timestamp with time zone not null default now()
);

insert into demo_test (message)
values ('Flyway migration initialized');
