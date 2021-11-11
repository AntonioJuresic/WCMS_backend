USE `wcms`;

insert  into `authority`(`id`,`level`,`title`) values 
(1,1,'administrator');

insert  into `user`(`id`,`username`,`email`,`imagePath`,`password`,`dateOfCreation`,`deleted`,`authorityId`) values 
(1,'admin','antonio.juresic.email@gmail.com','./public/uploads/Seiji_Amasawa.jpg','dbac9cdef871d215a08253822fbda17105cc6ecfe9aa36ccab824b2b8e98c571d43756cf512d656616a36a34c448eaddc94048527c64476c7964e6e4d7e05ce1','2021-10-10 14:00:00',0,1);
