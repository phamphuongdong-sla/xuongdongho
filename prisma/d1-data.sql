PRAGMA foreign_keys=OFF;
DELETE FROM AuditLog;
DELETE FROM Alert;
DELETE FROM RepairVoucherSparePart;
DELETE FROM RepairVoucher;
DELETE FROM MeterInspection;
DELETE FROM TransferVoucherDetail;
DELETE FROM TransferVoucher;
DELETE FROM ExportVoucherDetail;
DELETE FROM ExportVoucher;
DELETE FROM ImportVoucherDetail;
DELETE FROM ImportVoucher;
DELETE FROM ContractBatch;
DELETE FROM Contract;
DELETE FROM Inventory;
DELETE FROM MeterSparePart;
DELETE FROM SparePart;
DELETE FROM Meter;
DELETE FROM User;
DELETE FROM Employee;
DELETE FROM Unit;
INSERT INTO User VALUES(23,'admin@sowasuco.vn','sha256:5c3e7465678751e7719e02c1707dfd1868689554a005b577ec942476d2844c84','Phạm Phương Đông',NULL,'Phòng Quản lý Khách hàng',66,'admin',1,1789370598687,1789370597728,1789370598687);
INSERT INTO User VALUES(24,'phamphuongdong@gmail.com','sha256:5c3e7465678751e7719e02c1707dfd1868689554a005b577ec942476d2844c84','Phạm Phương Đông',NULL,'Phòng Quản lý Khách hàng',66,'admin',1,NULL,1789370597728,1789370597728);
INSERT INTO User VALUES(25,'thukho@sowasuco.vn','sha256:5c3e7465678751e7719e02c1707dfd1868689554a005b577ec942476d2844c84','Nguyễn Văn Kho',NULL,'Bộ phận Kho vật tư',66,'kho',1,1789370598688,1789370597729,1789370598689);
INSERT INTO User VALUES(26,'phieulinhdonhho.cnsl@gmail.com','sha256:5c3e7465678751e7719e02c1707dfd1868689554a005b577ec942476d2844c84','Nguyễn Văn Tiến',NULL,'Bộ phận Kho vật tư',66,'kho',1,NULL,1789370597729,1789370597729);
INSERT INTO User VALUES(27,'ktv@sowasuco.vn','sha256:5c3e7465678751e7719e02c1707dfd1868689554a005b577ec942476d2844c84','Trần Kỹ Thuật',NULL,'Xưởng sửa chữa đồng hồ',66,'ktv',1,1789370598690,1789370597730,1789370598691);
INSERT INTO User VALUES(28,'ketoan@sowasuco.vn','sha256:5c3e7465678751e7719e02c1707dfd1868689554a005b577ec942476d2844c84','Lê Thị Kế Toán',NULL,'Phòng Kế hoạch Tài chính',66,'accountant',1,1789370598692,1789370597731,1789370598692);
INSERT INTO User VALUES(29,'chinhanh.tp1@sowasuco.vn','sha256:5c3e7465678751e7719e02c1707dfd1868689554a005b577ec942476d2844c84','Lò Văn Nhánh',NULL,'Xí nghiệp Cấp nước TP 1',67,'unit_user',1,1789370598695,1789370597731,1789370598695);
INSERT INTO Meter VALUES(126,'ĐH015','Đồng hồ D15','Tiêu chuẩn',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,1789370597732,1789370597732);
INSERT INTO Meter VALUES(127,'ĐH015(SC)','Đồng hồ sửa chữa 015','Sửa chữa',NULL,'Cái',NULL,NULL,120000.0,80000.0,1,NULL,1789370597734,1789370597734);
INSERT INTO Meter VALUES(128,'ĐH015(SC)-DV','Đồng hồ sửa chữa 015 đơn vị','Sửa chữa',NULL,'Cái',NULL,NULL,120000.0,80000.0,0,NULL,1789370597735,1789370597735);
INSERT INTO Meter VALUES(129,'ĐH015-TAC','Đồng hồ Thái Aichi MAM-15 ( không kèm rắc co)','Ngoại nhập',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,1789370597735,1789370597735);
INSERT INTO Meter VALUES(130,'ĐH025','Đồng hồ D25','Tiêu chuẩn',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,1789370597736,1789370597736);
INSERT INTO Meter VALUES(131,'ĐH025(SC)','Đồng hồ D25 (sửa chữa)','Sửa chữa',NULL,'Cái',NULL,NULL,120000.0,80000.0,1,NULL,1789370597736,1789370597736);
INSERT INTO Meter VALUES(132,'ĐH032','Đồng hồ D32','Tiêu chuẩn',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,1789370597737,1789370597737);
INSERT INTO Meter VALUES(133,'ĐH032(SC)','Đồng hồ D32 (sửa chữa)','Sửa chữa',NULL,'Cái',NULL,NULL,120000.0,80000.0,1,NULL,1789370597737,1789370597737);
INSERT INTO Meter VALUES(134,'ĐH040','Đồng hồ D40','Tiêu chuẩn',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,1789370597738,1789370597738);
INSERT INTO Meter VALUES(135,'ĐH040(SC)','Đồng hồ D40 (sửa chữa)','Sửa chữa',NULL,'Cái',NULL,NULL,120000.0,80000.0,1,NULL,1789370597739,1789370597739);
INSERT INTO Meter VALUES(136,'ĐH040-ĐLL','Đồng hồ đo lưu lượng Turbobar hiệu Bermad DN40','Ngoại nhập',NULL,'Bộ',NULL,NULL,350000.0,250000.0,1,NULL,1789370597739,1789370597739);
INSERT INTO Meter VALUES(137,'ĐH050','Đồng hồ D50','Tiêu chuẩn',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,1789370597740,1789370597740);
INSERT INTO Meter VALUES(138,'ĐH050(SC)','Đồng hồ D50 (sửa chữa)','Sửa chữa',NULL,'Cái',NULL,NULL,120000.0,80000.0,1,NULL,1789370597741,1789370597741);
INSERT INTO Meter VALUES(139,'ĐH050-BM','Đồng hồ DN50 hiệu Bermad','Ngoại nhập',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,1789370597742,1789370597742);
INSERT INTO Meter VALUES(140,'ĐH065','Đồng hồ D65','Tiêu chuẩn',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,1789370597743,1789370597743);
INSERT INTO Meter VALUES(141,'ĐH065-ĐLL','Đồng hồ đo lưu lượng Turbobar hiệu Bermad DN65','Ngoại nhập',NULL,'Bộ',NULL,NULL,350000.0,250000.0,1,NULL,1789370597744,1789370597744);
INSERT INTO Meter VALUES(142,'ĐH080','Đồng hồ D80','Tiêu chuẩn',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,1789370597744,1789370597744);
INSERT INTO Meter VALUES(143,'ĐH100','Đồng hồ D100','Tiêu chuẩn',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,1789370597745,1789370597745);
INSERT INTO Meter VALUES(144,'ĐH150','Đồng hồ nước DN150 CONTOR-Metcon','Ngoại nhập',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,1789370597747,1789370597747);
INSERT INTO Meter VALUES(145,'ĐH150-CTOR','Đồng hồ nước DN150 CONTOR-Metcon','Ngoại nhập',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,1789370597748,1789370597748);
INSERT INTO Meter VALUES(146,'ĐH200','Đồng hồ D200','Tiêu chuẩn',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,1789370597749,1789370597749);
INSERT INTO Meter VALUES(147,'ĐH15','Đồng hồ D15 metcon','Tiêu chuẩn',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,1789370597749,1789370597749);
INSERT INTO Meter VALUES(148,'D25FLD','Đồng hồ D25 Flodis','Ngoại nhập',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,1789370597749,1789370597749);
INSERT INTO Meter VALUES(149,'D32FLD','Đồng hồ D32 Flodis','Ngoại nhập',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,1789370597750,1789370597750);
INSERT INTO Meter VALUES(150,'D40FLT','Đồng hồ D40 Flostar','Tiêu chuẩn',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,1789370597751,1789370597751);
INSERT INTO SparePart VALUES(176,'VP-D15-001','Nắp đồng hồ D15','Nắp',NULL,'Cái',14300.0,20,1,NULL,1789370597752,1789370597752);
INSERT INTO SparePart VALUES(177,'VP-D15-002','Chụp xoay đồng hồ D15','Chụp',NULL,'Cái',22750.0,20,1,NULL,1789370597753,1789370597753);
INSERT INTO SparePart VALUES(178,'VP-D15-003','Gioăng sắt','Gioăng',NULL,'Cái',0.0,20,1,NULL,1789370597754,1789370597754);
INSERT INTO SparePart VALUES(179,'VP-D15-004','Mặt số đồng hồ D15','Mặt số',NULL,'Cái',179400.0,20,1,NULL,1789370597755,1789370597755);
INSERT INTO SparePart VALUES(180,'VP-D15-005','Nắp chặn buồng đo D15','Nắp',NULL,'Cái',32500.0,20,1,NULL,1789370597755,1789370597755);
INSERT INTO SparePart VALUES(181,'VP-D15-006','Cánh quạt đồng hồ D15','Cánh quạt',NULL,'Cái',52000.0,20,1,NULL,1789370597756,1789370597756);
INSERT INTO SparePart VALUES(182,'VP-D15-007','Buồng đo đồng hồ D15','Buồng đo',NULL,'Cái',46800.0,20,1,NULL,1789370597757,1789370597757);
INSERT INTO SparePart VALUES(183,'VP-D15-008','Bộ phận chỉnh bù lưu lượng đồng hồ D15 (vít tinh chỉnh)','Vít tinh chỉnh',NULL,'Cái',14300.0,20,1,NULL,1789370597758,1789370597758);
INSERT INTO SparePart VALUES(184,'VP-D15-009','Gioăng nắp chặn buồng đo đồng hồ D15 (số 9)','Nắp',NULL,'Cái',14300.0,20,1,NULL,1789370597759,1789370597759);
INSERT INTO SparePart VALUES(185,'VP-D15-010','Gioăng ốc chặn nút chỉnh đồng hồ D15 (số 14)','Gioăng',NULL,'Cái',4420.0,20,1,NULL,1789370597760,1789370597760);
INSERT INTO SparePart VALUES(186,'VP-D15-011','Vành chống từ đồng hồ D15','Vành chống từ',NULL,'Cái',19500.0,20,1,NULL,1789370597761,1789370597761);
INSERT INTO SparePart VALUES(187,'VP-D15-012','Gioăng cao su chặn buồng đo D15 (gioăng số 12)','Gioăng',NULL,'Cái',11700.0,20,1,NULL,1789370597762,1789370597762);
INSERT INTO SparePart VALUES(188,'VP-D15-013','Ốc chặn MTM bộ phận chỉnh bù lưu lượng D15','Vít tinh chỉnh',NULL,'Cái',10660.0,20,1,NULL,1789370597763,1789370597763);
INSERT INTO SparePart VALUES(189,'VP-014','Nắp đồng hồ to','Nắp',NULL,'Cái',21000.0,20,1,NULL,1789370597763,1789370597763);
INSERT INTO SparePart VALUES(190,'VP-015','Chụp xoay đồng hồ to','Chụp',NULL,'Cái',83400.0,20,1,NULL,1789370597764,1789370597764);
INSERT INTO SparePart VALUES(191,'VP-016','Mặt số D25-32','Mặt số',NULL,'Cái',659100.0,20,1,NULL,1789370597765,1789370597765);
INSERT INTO SparePart VALUES(192,'VP-017','Mặt số D40-50','Mặt số',NULL,'Cái',791000.0,20,1,NULL,1789370597766,1789370597766);
INSERT INTO SparePart VALUES(193,'VP-018','Cánh quạt D25,32','Cánh quạt',NULL,'Cái',197800.0,20,1,NULL,1789370597767,1789370597767);
INSERT INTO SparePart VALUES(194,'VP-019','Cánh quạt D40,50','Cánh quạt',NULL,'Cái',347100.0,20,1,NULL,1789370597768,1789370597768);
INSERT INTO SparePart VALUES(195,'VP-020','Buồng đo D25,32','Buồng đo',NULL,'Cái',131900.0,20,1,NULL,1789370597768,1789370597768);
INSERT INTO SparePart VALUES(196,'VP-021','Buồng đo D40,50','Buồng đo',NULL,'Cái',462700.0,20,1,NULL,1789370597769,1789370597769);
INSERT INTO SparePart VALUES(197,'VP-022','Chụp buồng đo D40,50','Chụp',NULL,'Cái',173700.0,20,1,NULL,1789370597770,1789370597770);
INSERT INTO SparePart VALUES(198,'VP-023','Nắp chặn trên D40,50,25,32','Nắp',NULL,'Cái',173700.0,20,1,NULL,1789370597771,1789370597771);
INSERT INTO SparePart VALUES(199,'VP-025','Vòng chặn D25,32','Linh kiện khác',NULL,'Cái',58500.0,20,1,NULL,1789370597771,1789370597771);
INSERT INTO SparePart VALUES(200,'VP-026','Vành chống từ','Vành chống từ',NULL,'Cái',19500.0,20,1,NULL,1789370597772,1789370597772);
INSERT INTO SparePart VALUES(201,'VP-027','gioăng số 7 D40,50,25,32','Gioăng',NULL,'Cái',14100.0,20,1,NULL,1789370597772,1789370597772);
INSERT INTO SparePart VALUES(202,'VP-028','gioăng số 9 D40 nhỏ','Gioăng',NULL,'Cái',31200.0,20,1,NULL,1789370597773,1789370597773);
INSERT INTO SparePart VALUES(203,'VP-029','gioăng số 12 D40','Gioăng',NULL,'Cái',46500.0,20,1,NULL,1789370597774,1789370597774);
INSERT INTO SparePart VALUES(204,'VP-030','gioăng số 9 D40 to','Gioăng',NULL,'Cái',28300.0,20,1,NULL,1789370597775,1789370597775);
INSERT INTO SparePart VALUES(205,'VP-031','gioăng số 11 D25','Gioăng',NULL,'Cái',7200.0,20,1,NULL,1789370597776,1789370597776);
INSERT INTO SparePart VALUES(206,'VP-032','Vít tinh chỉnh D25,32','Vít tinh chỉnh',NULL,'Cái',21000.0,20,1,NULL,1789370597777,1789370597777);
INSERT INTO SparePart VALUES(207,'VP-033','Vít tinh chỉnh D40,50','Vít tinh chỉnh',NULL,'Cái',21000.0,20,1,NULL,1789370597777,1789370597777);
INSERT INTO SparePart VALUES(208,'VP-034','Lưới lọc 25,32','Linh kiện khác',NULL,'Cái',46500.0,20,1,NULL,1789370597778,1789370597778);
INSERT INTO SparePart VALUES(209,'VP-035','Lưới lọc 40,50','Linh kiện khác',NULL,'Cái',86900.0,20,1,NULL,1789370597779,1789370597779);
INSERT INTO SparePart VALUES(210,'VP-037','Vành Dưới Buồng đo D40-D50','Buồng đo',NULL,'Cái',0.0,20,1,NULL,1789370597780,1789370597780);
INSERT INTO MeterSparePart VALUES(61,126,176,1,1789370597781);
INSERT INTO MeterSparePart VALUES(62,126,177,1,1789370597781);
INSERT INTO MeterSparePart VALUES(63,126,178,1,1789370597781);
INSERT INTO MeterSparePart VALUES(64,126,179,1,1789370597782);
INSERT INTO MeterSparePart VALUES(65,126,180,1,1789370597782);
INSERT INTO MeterSparePart VALUES(66,126,181,1,1789370597783);
INSERT INTO MeterSparePart VALUES(67,126,182,1,1789370597783);
INSERT INTO MeterSparePart VALUES(68,126,183,1,1789370597783);
INSERT INTO MeterSparePart VALUES(69,126,184,1,1789370597784);
INSERT INTO MeterSparePart VALUES(70,126,185,1,1789370597784);
INSERT INTO MeterSparePart VALUES(71,126,186,1,1789370597785);
INSERT INTO MeterSparePart VALUES(72,126,187,1,1789370597785);
INSERT INTO Contract VALUES(7,'HD-2026-LINHKIEN','Hợp đồng mua sắm vật tư linh kiện sửa chữa đồng hồ năm 2026','Công ty Cổ phần Thiết bị & Công nghệ Nước Sài Gòn',1767571200000,350000000.0,'active','Hợp đồng mua theo nhiều đợt giao hàng trong năm 2026',1789370597786,1789370597786);
INSERT INTO ContractBatch VALUES(24,7,1,'Đợt 1 - Cung ứng Tháng 01/2026',1768003200000,1768176000000,'completed','Đã nhập kho đủ theo phiếu giao nhận đợt 1',1789370597787,1789370597787);
INSERT INTO ContractBatch VALUES(25,7,2,'Đợt 2 - Cung ứng Tháng 05/2026',1778803200000,1779062400000,'completed','Bổ sung linh kiện D15 đợt cao điểm',1789370597787,1789370597787);
INSERT INTO ContractBatch VALUES(26,7,3,'Đợt 3 - Cung ứng Tháng 06/2026',1781049600000,1781395200000,'completed','Bổ sung chụp xoay và gioăng',1789370597787,1789370597787);
INSERT INTO ContractBatch VALUES(27,7,4,'Đợt 4 - Cung ứng Tháng 07/2026',1784505600000,1784678400000,'completed','Đợt linh kiện định kỳ quý 3',1789370597787,1789370597787);
INSERT INTO Inventory VALUES(413,66,126,NULL,500,'new',1789370597733);
INSERT INTO Inventory VALUES(414,66,134,NULL,4,'new',1789370597738);
INSERT INTO Inventory VALUES(415,66,136,NULL,1,'new',1789370597740);
INSERT INTO Inventory VALUES(416,66,137,NULL,2,'new',1789370597741);
INSERT INTO Inventory VALUES(417,66,139,NULL,6,'new',1789370597742);
INSERT INTO Inventory VALUES(418,66,140,NULL,4,'new',1789370597743);
INSERT INTO Inventory VALUES(419,66,142,NULL,2,'new',1789370597745);
INSERT INTO Inventory VALUES(420,66,143,NULL,4,'new',1789370597746);
INSERT INTO Inventory VALUES(421,66,144,NULL,3,'new',1789370597747);
INSERT INTO Inventory VALUES(422,66,145,NULL,1,'new',1789370597748);
INSERT INTO Inventory VALUES(423,66,148,NULL,17,'new',1789370597750);
INSERT INTO Inventory VALUES(424,66,149,NULL,38,'new',1789370597751);
INSERT INTO Inventory VALUES(425,66,NULL,176,2510,'new',1789370597753);
INSERT INTO Inventory VALUES(426,66,NULL,177,2648,'new',1789370597754);
INSERT INTO Inventory VALUES(427,66,NULL,179,560,'new',1789370597755);
INSERT INTO Inventory VALUES(428,66,NULL,180,4905,'new',1789370597756);
INSERT INTO Inventory VALUES(429,66,NULL,181,3539,'new',1789370597757);
INSERT INTO Inventory VALUES(430,66,NULL,182,3208,'new',1789370597758);
INSERT INTO Inventory VALUES(431,66,NULL,183,2410,'new',1789370597758);
INSERT INTO Inventory VALUES(432,66,NULL,184,2490,'new',1789370597759);
INSERT INTO Inventory VALUES(433,66,NULL,185,1790,'new',1789370597760);
INSERT INTO Inventory VALUES(434,66,NULL,186,3799,'new',1789370597761);
INSERT INTO Inventory VALUES(435,66,NULL,187,2755,'new',1789370597762);
INSERT INTO Inventory VALUES(436,66,NULL,188,3210,'new',1789370597763);
INSERT INTO Inventory VALUES(437,66,NULL,191,25,'new',1789370597765);
INSERT INTO Inventory VALUES(438,66,NULL,192,87,'new',1789370597766);
INSERT INTO Inventory VALUES(439,66,NULL,193,11,'new',1789370597767);
INSERT INTO Inventory VALUES(440,66,NULL,195,10,'new',1789370597769);
INSERT INTO Inventory VALUES(441,66,NULL,196,70,'new',1789370597770);
INSERT INTO Inventory VALUES(442,66,NULL,197,88,'new',1789370597770);
INSERT INTO Inventory VALUES(443,66,NULL,201,39,'new',1789370597773);
INSERT INTO Inventory VALUES(444,66,NULL,202,30,'new',1789370597773);
INSERT INTO Inventory VALUES(445,66,NULL,203,108,'new',1789370597774);
INSERT INTO Inventory VALUES(446,66,NULL,204,89,'new',1789370597775);
INSERT INTO Inventory VALUES(447,66,NULL,205,67,'new',1789370597776);
INSERT INTO Inventory VALUES(448,66,NULL,206,16,'new',1789370597777);
INSERT INTO Inventory VALUES(449,66,NULL,207,24,'new',1789370597778);
INSERT INTO Inventory VALUES(450,66,NULL,208,29,'new',1789370597779);
INSERT INTO Inventory VALUES(451,66,NULL,209,21,'new',1789370597780);
INSERT INTO Inventory VALUES(452,67,126,NULL,45,'circulating',1789370597788);
INSERT INTO Inventory VALUES(453,67,126,NULL,15,'new',1789370597788);
INSERT INTO Inventory VALUES(454,67,126,NULL,8,'sent_for_repair',1789370597788);
INSERT INTO Inventory VALUES(455,68,126,NULL,45,'circulating',1789370597789);
INSERT INTO Inventory VALUES(456,68,126,NULL,15,'new',1789370597789);
INSERT INTO Inventory VALUES(457,68,126,NULL,8,'sent_for_repair',1789370597789);
INSERT INTO Inventory VALUES(458,69,126,NULL,45,'circulating',1789370597789);
INSERT INTO Inventory VALUES(459,69,126,NULL,15,'new',1789370597789);
INSERT INTO Inventory VALUES(460,69,126,NULL,8,'sent_for_repair',1789370597789);
INSERT INTO Inventory VALUES(461,70,126,NULL,45,'circulating',1789370597790);
INSERT INTO Inventory VALUES(462,70,126,NULL,15,'new',1789370597790);
INSERT INTO Inventory VALUES(463,70,126,NULL,8,'sent_for_repair',1789370597790);
INSERT INTO Inventory VALUES(464,71,126,NULL,45,'circulating',1789370597790);
INSERT INTO Inventory VALUES(465,71,126,NULL,15,'new',1789370597790);
INSERT INTO Inventory VALUES(466,71,126,NULL,8,'sent_for_repair',1789370597790);
INSERT INTO Inventory VALUES(467,72,126,NULL,45,'circulating',1789370597791);
INSERT INTO Inventory VALUES(468,72,126,NULL,15,'new',1789370597791);
INSERT INTO Inventory VALUES(469,72,126,NULL,8,'sent_for_repair',1789370597791);
INSERT INTO Inventory VALUES(470,73,126,NULL,45,'circulating',1789370597791);
INSERT INTO Inventory VALUES(471,73,126,NULL,15,'new',1789370597791);
INSERT INTO Inventory VALUES(472,73,126,NULL,8,'sent_for_repair',1789370597791);
INSERT INTO Inventory VALUES(473,74,126,NULL,45,'circulating',1789370597792);
INSERT INTO Inventory VALUES(474,74,126,NULL,15,'new',1789370597792);
INSERT INTO Inventory VALUES(475,74,126,NULL,8,'sent_for_repair',1789370597792);
INSERT INTO Inventory VALUES(476,75,126,NULL,45,'circulating',1789370597792);
INSERT INTO Inventory VALUES(477,75,126,NULL,15,'new',1789370597792);
INSERT INTO Inventory VALUES(478,75,126,NULL,8,'sent_for_repair',1789370597792);
INSERT INTO Inventory VALUES(479,76,126,NULL,45,'circulating',1789370597793);
INSERT INTO Inventory VALUES(480,76,126,NULL,15,'new',1789370597793);
INSERT INTO Inventory VALUES(481,76,126,NULL,8,'sent_for_repair',1789370597793);
INSERT INTO Inventory VALUES(482,77,126,NULL,45,'circulating',1789370597793);
INSERT INTO Inventory VALUES(483,77,126,NULL,15,'new',1789370597793);
INSERT INTO Inventory VALUES(484,77,126,NULL,8,'sent_for_repair',1789370597793);
INSERT INTO Inventory VALUES(485,78,126,NULL,45,'circulating',1789370597793);
INSERT INTO Inventory VALUES(486,78,126,NULL,15,'new',1789370597793);
INSERT INTO Inventory VALUES(487,78,126,NULL,8,'sent_for_repair',1789370597793);
INSERT INTO ImportVoucherDetail VALUES(74,17,126,NULL,20,80000.0,1600000.0,'sent_for_repair','Đồng hồ cũ tháo gỡ chờ kiểm định & sửa chữa',1789370597795);
INSERT INTO ImportVoucherDetail VALUES(75,17,130,NULL,5,120000.0,600000.0,'sent_for_repair','Đồng hồ DN25 cũ cần thay buồng đo',1789370597795);
INSERT INTO ImportVoucherDetail VALUES(76,18,126,NULL,15,80000.0,1200000.0,'sent_for_repair','Đồng hồ cũ tháo gỡ chờ kiểm định & sửa chữa',1789370597796);
INSERT INTO ImportVoucherDetail VALUES(77,19,126,NULL,12,80000.0,960000.0,'sent_for_repair','Đồng hồ cũ tháo gỡ chờ kiểm định & sửa chữa',1789370597798);
INSERT INTO ImportVoucherDetail VALUES(78,19,130,NULL,3,120000.0,360000.0,'sent_for_repair','Đồng hồ DN25 cũ cần thay buồng đo',1789370597798);
INSERT INTO ImportVoucherDetail VALUES(79,20,126,NULL,18,80000.0,1440000.0,'sent_for_repair','Đồng hồ cũ tháo gỡ chờ kiểm định & sửa chữa',1789370597799);
INSERT INTO ImportVoucherDetail VALUES(80,20,130,NULL,4,120000.0,480000.0,'sent_for_repair','Đồng hồ DN25 cũ cần thay buồng đo',1789370597800);
INSERT INTO ImportVoucherDetail VALUES(81,21,126,NULL,10,80000.0,800000.0,'sent_for_repair','Đồng hồ cũ tháo gỡ chờ kiểm định & sửa chữa',1789370597801);
INSERT INTO ImportVoucherDetail VALUES(82,22,126,NULL,8,80000.0,640000.0,'sent_for_repair','Đồng hồ cũ tháo gỡ chờ kiểm định & sửa chữa',1789370597813);
INSERT INTO ImportVoucherDetail VALUES(83,22,130,NULL,2,120000.0,240000.0,'sent_for_repair','Đồng hồ DN25 cũ cần thay buồng đo',1789370597816);
INSERT INTO ImportVoucherDetail VALUES(84,23,NULL,176,500,14300.0,7150000.0,'new','Nắp D15 mới',1789370597823);
INSERT INTO ImportVoucherDetail VALUES(85,23,NULL,177,400,22750.0,9100000.0,'new','Chụp xoay D15 mới',1789370597823);
INSERT INTO ImportVoucherDetail VALUES(86,23,NULL,178,300,48000.0,14400000.0,'new','Mặt số D15 mới',1789370597823);
INSERT INTO ExportVoucher VALUES(14,'PXK-2026-0001',1771545600000,'unit_distribution',66,67,25,'completed',2160000.0,'Xuất cấp trả 18 đồng hồ D15 quay vòng sau sửa chữa cho TP1',1789370597829,1789370597829,'Nguyễn Văn Tiến','Đại diện nhận hàng chi nhánh');
INSERT INTO ExportVoucher VALUES(15,'PXK-2026-0002',1772409600000,'unit_distribution',66,68,25,'completed',1800000.0,'Xuất cấp 15 đồng hồ D15 quay vòng phục vụ thay thế khách hàng',1789370597830,1789370597830,'Nguyễn Văn Tiến','Đại diện nhận hàng chi nhánh');
INSERT INTO ExportVoucher VALUES(16,'PXK-2026-0003',1773273600000,'unit_distribution',66,69,25,'completed',1200000.0,'Cấp phát 10 đồng hồ D15 theo kế hoạch quý 1',1789370597832,1789370597832,'Nguyễn Văn Tiến','Đại diện nhận hàng chi nhánh');
INSERT INTO ExportVoucher VALUES(17,'PXK-2026-0004',1774396800000,'unit_distribution',66,70,25,'completed',1440000.0,'Cấp phát đồng hồ thay thế định kỳ cho CNCN Mộc Châu',1789370597833,1789370597833,'Nguyễn Văn Tiến','Đại diện nhận hàng chi nhánh');
INSERT INTO ExportVoucher VALUES(18,'PXK-2026-0005',1775779200000,'unit_distribution',66,71,25,'completed',1200000.0,'Xuất kho đồng hồ quay vòng cho CNCN Yên Châu',1789370597834,1789370597834,'Nguyễn Văn Tiến','Đại diện nhận hàng chi nhánh');
INSERT INTO ExportVoucher VALUES(19,'PXK-2026-0006',1776470400000,'unit_distribution',66,74,25,'completed',960000.0,'Xuất cấp phát đồng hồ cho CNCN Sông Mã',1789370597835,1789370597835,'Nguyễn Văn Tiến','Đại diện nhận hàng chi nhánh');
INSERT INTO ExportVoucherDetail VALUES(16,14,126,NULL,18,120000.0,2160000.0,'circulating','Đồng hồ quay vòng xưởng đã kiểm định đạt',1789370597830);
INSERT INTO ExportVoucherDetail VALUES(17,15,126,NULL,15,120000.0,1800000.0,'circulating','Đồng hồ quay vòng xưởng đã kiểm định đạt',1789370597831);
INSERT INTO ExportVoucherDetail VALUES(18,16,126,NULL,10,120000.0,1200000.0,'circulating','Đồng hồ quay vòng xưởng đã kiểm định đạt',1789370597832);
INSERT INTO ExportVoucherDetail VALUES(19,17,126,NULL,12,120000.0,1440000.0,'circulating','Đồng hồ quay vòng xưởng đã kiểm định đạt',1789370597833);
INSERT INTO ExportVoucherDetail VALUES(20,18,126,NULL,10,120000.0,1200000.0,'circulating','Đồng hồ quay vòng xưởng đã kiểm định đạt',1789370597834);
INSERT INTO ExportVoucherDetail VALUES(21,19,126,NULL,8,120000.0,960000.0,'circulating','Đồng hồ quay vòng xưởng đã kiểm định đạt',1789370597835);
INSERT INTO RepairVoucher VALUES(19,'PSC-2026-0001',1771113600000,66,126,20,18,2,23,27,'completed','Bảo dưỡng sửa chữa đồng hồ D15 đợt 1',1789370597823,1789370597823,NULL,NULL);
INSERT INTO RepairVoucher VALUES(20,'PSC-2026-0002',1772236800000,66,126,15,15,0,23,27,'completed','Thay thế buồng đo và gioăng mặt số D15',1789370597825,1789370597825,NULL,NULL);
INSERT INTO RepairVoucher VALUES(21,'PSC-2026-0003',1773100800000,66,130,10,9,1,23,27,'completed','Sửa chữa đồng hồ D25 chi nhánh Mộc Châu gửi',1789370597826,1789370597826,NULL,NULL);
INSERT INTO RepairVoucher VALUES(22,'PSC-2026-0004',1773964800000,66,126,12,12,0,23,27,'completed','Vệ sinh, căn chỉnh vít bù lưu lượng và hiệu chuẩn',1789370597827,1789370597827,NULL,NULL);
INSERT INTO RepairVoucher VALUES(23,'PSC-2026-0005',1775347200000,66,126,16,15,1,23,27,'completed','Hoàn tất sửa chữa lô ĐH cũ Yên Châu và Mai Sơn',1789370597828,1789370597828,NULL,NULL);
INSERT INTO RepairVoucherSparePart VALUES(56,19,176,18,14300.0,1789370597824);
INSERT INTO RepairVoucherSparePart VALUES(57,19,177,18,22750.0,1789370597824);
INSERT INTO RepairVoucherSparePart VALUES(58,20,176,15,14300.0,1789370597825);
INSERT INTO RepairVoucherSparePart VALUES(59,20,177,15,22750.0,1789370597825);
INSERT INTO RepairVoucherSparePart VALUES(60,21,176,9,14300.0,1789370597826);
INSERT INTO RepairVoucherSparePart VALUES(61,21,177,9,22750.0,1789370597826);
INSERT INTO RepairVoucherSparePart VALUES(62,22,176,12,14300.0,1789370597827);
INSERT INTO RepairVoucherSparePart VALUES(63,22,177,12,22750.0,1789370597827);
INSERT INTO RepairVoucherSparePart VALUES(64,23,176,15,14300.0,1789370597829);
INSERT INTO RepairVoucherSparePart VALUES(65,23,177,15,22750.0,1789370597829);
INSERT INTO Alert VALUES(11,66,NULL,NULL,'low_stock','Mặt số đồng hồ D15 (VP-004) tồn kho chỉ còn 560 cái, sắp chạm mức cảnh báo.',0,NULL,1789370597836);
INSERT INTO Alert VALUES(12,66,NULL,NULL,'low_stock','Đồng hồ D40 tồn kho hiện tại chỉ còn 4 cái.',0,NULL,1789370597836);
INSERT INTO Employee VALUES(1,'Nguyễn Văn Tiến','NVX-Số 02 ngõ 69 Tổ 8 Phường Chiềng Lề, TP Sơn La, tỉnh Sơn La','',NULL,'Xưởng đồng hồ','Thủ kho',1,'',1789091336553,1789115892884);
INSERT INTO Employee VALUES(2,'Bùi Đức Duy','ĐTX-01','0',NULL,'Xưởng đồng hồ','Đội trưởng',1,'',1789091336553,1789097577137);
INSERT INTO Employee VALUES(4,'Nguyễn Việt Hồng','NV-XNCN-TP01-01','',NULL,'XNCN Số 1','Giám đốc',1,'',1789091336555,1789115670860);
INSERT INTO Employee VALUES(6,'Nguyễn Ngọc Thạch','NV-XNCN-TP02-01','',NULL,'XNCN Số 2','Giám đốc',1,'',1789091336556,1789115709103);
INSERT INTO Employee VALUES(8,'Hồ Thành Trung','NV-XNCN-MS-01','',NULL,'Xí Nghiệp Mai Sơn','Giám đốc',1,'',1789091336556,1789097658332);
INSERT INTO Employee VALUES(10,'Phạm Minh Đức','NV-CNCN-MC-01','',NULL,'CNCN Mộc Châu','Giám đốc',1,'',1789091336557,1789115468747);
INSERT INTO Employee VALUES(12,'Trịnh Văn Hồng','NV-CNCN-YC-01','',NULL,'CNCN Yên Châu','Giám đốc',1,'',1789091336557,1789115776899);
INSERT INTO Employee VALUES(14,'Nguyễn Bá Bảo','NV-CNCN-BY-01','',NULL,'CNCN Bắc Yên','Giám đốc',1,'',1789091336558,1789097623544);
INSERT INTO Employee VALUES(15,'Nguyễn Bá Bảo','NV-CNCN-BY-02','',NULL,'CNCN Bắc Yên','Giám đốc',1,'',1789091336558,1789115810430);
INSERT INTO Employee VALUES(16,'Vũ Ngọc Tuấn','NV-CNCN-TC-01','',NULL,'CNCN Thuận Châu','Giám đốc',1,'',1789091336558,1789115732318);
INSERT INTO Employee VALUES(18,'Ngô Thế Nghĩa','NV-CNCN-PY-01','',NULL,'CNCN Phù Yên','Giám đốc',1,'',1789091336559,1789115498405);
INSERT INTO Employee VALUES(20,'Ngô Xuân Ngọc','NV-CNCN-ML-01','',NULL,'CNCN Mường La','Giám đốc',1,'',1789091336559,1789115446479);
INSERT INTO Employee VALUES(22,'Nguyễn Văn Sơn','NV-CNCN-SM-01','',NULL,'CNCN Sông Mã','Giám đốc',1,'',1789091336559,1789115575375);
INSERT INTO Employee VALUES(24,'Đoàn Quang Việt','NV-CN-SC-01','',NULL,'CNCN Sốp Cộp','Giám đốc',1,'',1789091336560,1789115612674);
INSERT INTO Employee VALUES(26,'Trần Xuân Long','NV-CNCN-QN-01','',NULL,'CNCN Quỳnh Nhai','Giám đốc',1,'',1789091336560,1789115520701);
INSERT INTO Employee VALUES(28,'Lương Phương Thảo','NV-LPT',NULL,NULL,'Xưởng đồng hồ','Cán bộ lập phiếu',1,NULL,1789099449672,1789099449672);
INSERT INTO ImportVoucher VALUES(17,'PNK-2026-TH-001',1770508800000,'old_meters_return',NULL,NULL,66,67,'Cán bộ kỹ thuật chi nhánh','Nguyễn Văn Tiến',25,'completed',2000000.0,'Tiếp nhận đồng hồ tháo gỡ cũ từ đơn vị XNCN-TP01 về xưởng bảo dưỡng, sửa chữa quay vòng',1789370597794,1789370597794,'Phòng Quản lý Khách hàng','Trần Kỹ Thuật');
INSERT INTO ImportVoucher VALUES(18,'PNK-2026-TH-002',1770854400000,'old_meters_return',NULL,NULL,66,68,'Cán bộ kỹ thuật chi nhánh','Nguyễn Văn Tiến',25,'completed',1200000.0,'Tiếp nhận đồng hồ tháo gỡ cũ từ đơn vị XNCN-TP02 về xưởng bảo dưỡng, sửa chữa quay vòng',1789370597796,1789370597796,'Phòng Quản lý Khách hàng','Trần Kỹ Thuật');
INSERT INTO ImportVoucher VALUES(19,'PNK-2026-TH-003',1771977600000,'old_meters_return',NULL,NULL,66,69,'Cán bộ kỹ thuật chi nhánh','Nguyễn Văn Tiến',25,'completed',1200000.0,'Tiếp nhận đồng hồ tháo gỡ cũ từ đơn vị XNCN-MS về xưởng bảo dưỡng, sửa chữa quay vòng',1789370597797,1789370597797,'Phòng Quản lý Khách hàng','Trần Kỹ Thuật');
INSERT INTO ImportVoucher VALUES(20,'PNK-2026-TH-004',1772668800000,'old_meters_return',NULL,NULL,66,70,'Cán bộ kỹ thuật chi nhánh','Nguyễn Văn Tiến',25,'completed',1760000.0,'Tiếp nhận đồng hồ tháo gỡ cũ từ đơn vị CNCN-MC về xưởng bảo dưỡng, sửa chữa quay vòng',1789370597799,1789370597799,'Phòng Quản lý Khách hàng','Trần Kỹ Thuật');
INSERT INTO ImportVoucher VALUES(21,'PNK-2026-TH-005',1773532800000,'old_meters_return',NULL,NULL,66,71,'Cán bộ kỹ thuật chi nhánh','Nguyễn Văn Tiến',25,'completed',800000.0,'Tiếp nhận đồng hồ tháo gỡ cũ từ đơn vị CNCN-YC về xưởng bảo dưỡng, sửa chữa quay vòng',1789370597800,1789370597800,'Phòng Quản lý Khách hàng','Trần Kỹ Thuật');
INSERT INTO ImportVoucher VALUES(22,'PNK-2026-TH-006',1774137600000,'old_meters_return',NULL,NULL,66,74,'Cán bộ kỹ thuật chi nhánh','Nguyễn Văn Tiến',25,'completed',800000.0,'Tiếp nhận đồng hồ tháo gỡ cũ từ đơn vị CNCN-SM về xưởng bảo dưỡng, sửa chữa quay vòng',1789370597801,1789370597801,'Phòng Quản lý Khách hàng','Trần Kỹ Thuật');
INSERT INTO ImportVoucher VALUES(23,'PNK-2026-HD001',1768176000000,'purchase_contract',7,24,66,NULL,'Đại diện Công ty CP Thiết bị Nước Sài Gòn','Nguyễn Văn Tiến',25,'completed',85000000.0,'Nhập kho đợt 1 linh kiện đồng hồ D15 theo hợp đồng HD-2026-LINHKIEN',1789370597818,1789370597818,NULL,'Trần Kỹ Thuật');
INSERT INTO Unit VALUES(66,'KHO-VP','Xưởng đồng hồ','Kho/Xưởng','Ngõ 43, Tổ 6 Chiềng Lề - Phường Tô Hiệu - Tỉnh Sơn La','0212.3852.xxx',NULL,0,1,1789370597721,1789370597721);
INSERT INTO Unit VALUES(67,'XNCN-TP01','XNCN TP số 1','Xí nghiệp','TP Sơn La','0212.3852.001',NULL,1,1,1789370597722,1789370597722);
INSERT INTO Unit VALUES(68,'XNCN-TP02','XNCN TP số 2','Xí nghiệp','TP Sơn La','0212.3852.002',NULL,2,1,1789370597722,1789370597722);
INSERT INTO Unit VALUES(69,'XNCN-MS','XNCN Mai Sơn','Xí nghiệp','Huyện Mai Sơn','0212.3843.003',NULL,3,1,1789370597723,1789370597723);
INSERT INTO Unit VALUES(70,'CNCN-MC','CNCN Mộc Châu','Chi nhánh','Huyện Mộc Châu','0212.3866.004',NULL,4,1,1789370597723,1789370597723);
INSERT INTO Unit VALUES(71,'CNCN-YC','CNCN Yên Châu','Chi nhánh','Huyện Yên Châu','0212.3840.005',NULL,5,1,1789370597724,1789370597724);
INSERT INTO Unit VALUES(72,'CNCN-PY','CNCN Phù Yên','Chi nhánh','Huyện Phù Yên','0212.3863.008',NULL,6,1,1789370597724,1789370597724);
INSERT INTO Unit VALUES(73,'CNCN-BY','CNCN Bắc Yên','Chi nhánh','Huyện Bắc Yên','0212.3860.006',NULL,7,1,1789370597725,1789370597725);
INSERT INTO Unit VALUES(74,'CNCN-SM','CNCN Sông Mã','Chi nhánh','Huyện Sông Mã','0212.3836.010',NULL,8,1,1789370597725,1789370597725);
INSERT INTO Unit VALUES(75,'CN-SC','CNCN Sốp Cộp','Chi nhánh','Huyện Sốp Cộp','0212.3877.011',NULL,9,1,1789370597726,1789370597726);
INSERT INTO Unit VALUES(76,'CNCN-TC','CNCN Thuận Châu','Chi nhánh','Huyện Thuận Châu','0212.3847.007',NULL,10,1,1789370597726,1789370597726);
INSERT INTO Unit VALUES(77,'CNCN-ML','CNCN Mường La','Chi nhánh','Huyện Mường La','0212.3851.009',NULL,11,1,1789370597727,1789370597727);
INSERT INTO Unit VALUES(78,'CNCN-QN','CNCN Quỳnh Nhai','Chi nhánh','Huyện Quỳnh Nhai','0212.3872.012',NULL,12,1,1789370597727,1789370597727);
INSERT INTO sqlite_sequence VALUES('User',29);
INSERT INTO sqlite_sequence VALUES('Meter',150);
INSERT INTO sqlite_sequence VALUES('Inventory',487);
INSERT INTO sqlite_sequence VALUES('SparePart',210);
INSERT INTO sqlite_sequence VALUES('MeterSparePart',72);
INSERT INTO sqlite_sequence VALUES('Contract',7);
INSERT INTO sqlite_sequence VALUES('ContractBatch',27);
INSERT INTO sqlite_sequence VALUES('RepairVoucher',23);
INSERT INTO sqlite_sequence VALUES('RepairVoucherSparePart',65);
INSERT INTO sqlite_sequence VALUES('MeterInspection',4);
INSERT INTO sqlite_sequence VALUES('ExportVoucher',19);
INSERT INTO sqlite_sequence VALUES('ExportVoucherDetail',21);
INSERT INTO sqlite_sequence VALUES('Alert',12);
INSERT INTO sqlite_sequence VALUES('ImportVoucherDetail',86);
INSERT INTO sqlite_sequence VALUES('ImportVoucher',23);
INSERT INTO sqlite_sequence VALUES('Employee',28);
INSERT INTO sqlite_sequence VALUES('Unit',78);
-- Convert all DateTime columns in D1 from integer ms to ISO strings
UPDATE User SET
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END,
  updatedAt = CASE WHEN typeof(updatedAt) = 'integer' THEN datetime(updatedAt / 1000, 'unixepoch') ELSE updatedAt END,
  lastLogin = CASE WHEN typeof(lastLogin) = 'integer' THEN datetime(lastLogin / 1000, 'unixepoch') ELSE lastLogin END;

UPDATE Unit SET
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END,
  updatedAt = CASE WHEN typeof(updatedAt) = 'integer' THEN datetime(updatedAt / 1000, 'unixepoch') ELSE updatedAt END;

UPDATE Meter SET
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END,
  updatedAt = CASE WHEN typeof(updatedAt) = 'integer' THEN datetime(updatedAt / 1000, 'unixepoch') ELSE updatedAt END;

UPDATE SparePart SET
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END,
  updatedAt = CASE WHEN typeof(updatedAt) = 'integer' THEN datetime(updatedAt / 1000, 'unixepoch') ELSE updatedAt END;

UPDATE MeterSparePart SET
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END;

UPDATE Contract SET
  signDate = CASE WHEN typeof(signDate) = 'integer' THEN datetime(signDate / 1000, 'unixepoch') ELSE signDate END,
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END,
  updatedAt = CASE WHEN typeof(updatedAt) = 'integer' THEN datetime(updatedAt / 1000, 'unixepoch') ELSE updatedAt END;

UPDATE ContractBatch SET
  expectedDate = CASE WHEN typeof(expectedDate) = 'integer' THEN datetime(expectedDate / 1000, 'unixepoch') ELSE expectedDate END,
  actualDate = CASE WHEN typeof(actualDate) = 'integer' THEN datetime(actualDate / 1000, 'unixepoch') ELSE actualDate END,
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END,
  updatedAt = CASE WHEN typeof(updatedAt) = 'integer' THEN datetime(updatedAt / 1000, 'unixepoch') ELSE updatedAt END;

UPDATE Inventory SET
  lastUpdated = CASE WHEN typeof(lastUpdated) = 'integer' THEN datetime(lastUpdated / 1000, 'unixepoch') ELSE lastUpdated END;

UPDATE ImportVoucher SET
  voucherDate = CASE WHEN typeof(voucherDate) = 'integer' THEN datetime(voucherDate / 1000, 'unixepoch') ELSE voucherDate END,
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END,
  updatedAt = CASE WHEN typeof(updatedAt) = 'integer' THEN datetime(updatedAt / 1000, 'unixepoch') ELSE updatedAt END;

UPDATE ImportVoucherDetail SET
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END;

UPDATE ExportVoucher SET
  voucherDate = CASE WHEN typeof(voucherDate) = 'integer' THEN datetime(voucherDate / 1000, 'unixepoch') ELSE voucherDate END,
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END,
  updatedAt = CASE WHEN typeof(updatedAt) = 'integer' THEN datetime(updatedAt / 1000, 'unixepoch') ELSE updatedAt END;

UPDATE ExportVoucherDetail SET
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END;

UPDATE TransferVoucher SET
  voucherDate = CASE WHEN typeof(voucherDate) = 'integer' THEN datetime(voucherDate / 1000, 'unixepoch') ELSE voucherDate END,
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END,
  updatedAt = CASE WHEN typeof(updatedAt) = 'integer' THEN datetime(updatedAt / 1000, 'unixepoch') ELSE updatedAt END;

UPDATE TransferVoucherDetail SET
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END;

UPDATE RepairVoucher SET
  repairDate = CASE WHEN typeof(repairDate) = 'integer' THEN datetime(repairDate / 1000, 'unixepoch') ELSE repairDate END,
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END,
  updatedAt = CASE WHEN typeof(updatedAt) = 'integer' THEN datetime(updatedAt / 1000, 'unixepoch') ELSE updatedAt END;

UPDATE RepairVoucherSparePart SET
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END;

UPDATE MeterInspection SET
  inspectionDate = CASE WHEN typeof(inspectionDate) = 'integer' THEN datetime(inspectionDate / 1000, 'unixepoch') ELSE inspectionDate END,
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END,
  updatedAt = CASE WHEN typeof(updatedAt) = 'integer' THEN datetime(updatedAt / 1000, 'unixepoch') ELSE updatedAt END;

UPDATE AuditLog SET
  changedAt = CASE WHEN typeof(changedAt) = 'integer' THEN datetime(changedAt / 1000, 'unixepoch') ELSE changedAt END;

UPDATE Alert SET
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END;

UPDATE Employee SET
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END,
  updatedAt = CASE WHEN typeof(updatedAt) = 'integer' THEN datetime(updatedAt / 1000, 'unixepoch') ELSE updatedAt END;
