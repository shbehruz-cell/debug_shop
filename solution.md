A1:bareer tokenni kiritish qismini paydo qilish uchun:  main.ts fayliga swagger configga .addBearerAuth() ni qoshib qoydim

---------------------------------------------------------------------------
A2: tokenni kiritilgan bolsa ham unauthorized degan error qaytarishini yechimi: auth controllerdagi profile qismiga : @ApiBearerAuth() qoshib qoyildi

--------------------------------------------------------------------------------------------------------
A3: 403 forbidden error qaytarmasligi uchun auth serviceda login ichidagi tokenni payloadga role: user.role qoshdim va jwt strategyda validate returnga ham role: payload.role qoshib qoydim keyin test qilaman desam 401 error qaytardi user controllerda @ApiBearerAuth() qoshdim va ishlab ketdi

----------------------------------------------------------------------------------------------------------------

A4: auth/registerda parol ham kelmasligi uchun returnda dto.email va dto.fullName qilib qoydim ozi asli returnda osha userni ozini qaytarib qoyilgan ekan
auth servicedagi loginda esa returnda access token va userni ozini qaytarib qoyibdi men userni ochirib qoydim faqat access token qaytadigan boldi,admin barcha userlarni malumotini olganda faqat parolsiz korinadigan qilish uchun users.serviceda findallda returnda,
    return this.prisma.user.findMany({
      select: {id:true,fullName: true,email: true,role: true,createdAt: true},orderBy: { id: 'asc' },
    });
/api/users/me da esa controllerga qarasam osha murojat qilayotgan userni idsini olib findonega murojat qilayotgan ekan findOneni ham shunaqa korinishda qilib qoydim returnni ichidagi wheredan keyinga

--------------------------------------------------------------------------------------------------------------------
A5: email allaqachon royxatdan otilganmi tekshirish uchun auth service register funksiyasida akkaunt yaratilishidan oldin tekshirish amalga oshiriladi:
    const existsUser = await this.prisma.user.findUnique({where: {email: dto.email}})
    if(existsUser){
      throw new ConflictException("Bu emaildan allaqachon royxatdan otilgan")
    }



---------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------


B1: yangi akkaunt yaratishda validatsiya ishlamasligini sababi global validatsiya yoqilmagan : 
    app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  )

-----------------------------------------------------------------------------------------------
B2: yangi mahsulot yaratilganda 200 qaytishini 201ga ozgartirish uchun products controllerda :
    @HttpCode(HttpStatus.CREATED)
qilib qoydim

B3: products id boyicha qidirishda agar harf bolib qolsa 500 error berar edi buni osha findOne funksiyasini tepasida: 
    const numberId = Number(id)
    if(isNaN(numberId)){
      throw new BadRequestException("Raqam kiritilishi kerak")
    }
qilib qoydim;

---------------------------------------------------------------------------------------------------------
B4: mahsulot agar bolmasa ham 200 status bolishini togirlashda birinchi mahsulot bormi yoqmi ifda tekshirib agar bolmasa throw new NotFoundException()da error qaytardim

----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------
C1: agar limitni bosh qoldirib pageni 1 qilsak bu degani default limit boyicha 10ta otkazib yuborib qolgan limiti boyicha chiqaradigan edi bu degani agar 1 page limit kiritilmasa ozi 14ta mahsulot bolsa 4ta qaytarar edi yechim sifatida formulani pageni * limitga kopaytirishdan (page - 1) * limitga ozgartirdim

----------------------------------------------------------------------------------------------------
C2: meta.total har doim joriy sahifadagi elementlar soniga (items.length) teng bo‘lib qolayotgan edi, ya'ni agar limit=5 bo‘lsa jami mahsulotlar 14 ta bo‘lsa ham total 5 chiqib qolar edi  products service findAll funksiyasida Promise.all orqali findMany bilan bir vaqtda bazadan umumiy sonini oladigan this.prisma.product.count({ where }) ni chaqirdim va metaga total hamda sahifalar sonini hisoblaydigan totalPages: Math.ceil(total / limit) ni qo‘shib qo‘ydim:
    
    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { id: 'asc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

-------------------------------------------------------------------------------------------------------
C3: qidiruvda Iphone desa natija chiqib iphone deb kichik harfda yozsa chiqmayotgan edi men if(query.search) ichini 
    where.title = { contains: query.search,mode: 'insensitive' };
ga ozgartirdim yangi mode: 'insensitive' qoshildi

----------------------------------------------------------------------------------------------------------
C4: bitta mahsulotni olganda category obyekti kelmasligini yechish uchun products servicedagi findOne funksiyasida findUnique ichiga include:{category: true} qoshib qoydim shunda category id emas categoryni ozi id name slug bilan qaytadigan boldi

-------------------------------------------------------------------------------------------------------

C5: ochirilgan mahsulot deletedAt qoyilgandan keyin ham royxatda va bitta mahsulot qilib olganda korinar edi buni tuzatish uchun findAll dagi wherega deletedAt: null qoshdim shunda ochirilganlar filterlanib chiqadi findOnedagi if(!product) tekshirishga ham || product.deletedAt qoshdim shunda ochirilgan mahsulotni idsi orqali chaqirsa ham 404 qaytaradi

----------------------------------------------------------------------------------------------

C6: PATCH qilganda eski narx qaytishini sababi update funksiyasida bazani yangilagandan keyin ozgarmagan eski productni qaytarib yuborar edi men update qilingan natijani ozgaruvchiga saqlab (const updated = await this.prisma.product.update) keyin oshani return qildim

--------------------------------------------------------------------------------------

C7: savatga bir xil mahsulotni ikkinchi marta qoshsa unique constraint xatosi berar edi sababi userId va productId bor bolsa ham yana create qilinar edi men addItem funksiyasida create qilishdan oldin osha userda va osha productda cart item bor yoqligini findFirst bilan tekshirdim agar bor bolsa update qilib quantityni ustiga qoshdim yoq bolsa oldingidek create qildim

-------------------------------------------------------------------------------------------------------

C8: kategoriyani ochirganda ichida mahsulotlari bolsa foreign key xatosi berar edi men categories servicedagi remove funksiyasida delete qilishdan oldin osha categoryIdga tegishli mahsulotlar sonini count bilan oldim agar 0dan kop bolsa ConflictException tashladim va nechta mahsulot borligini xabarda yozdim

-------------------------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------------------------

D1: buyurtma summasi notogri chiqishini sababi orders servicedagi create funksiyasida total hisoblaganda faqat item.product.price qoshib borilar edi quantityga kopaytirilmagan edi men item.product.price * item.quantity qilib tuzatdim

------------------------------------------------------------------------------------------------------------------

D2: zaxiradan kop buyurtma berilib ketishini oldini olish uchun order yaratishdan oldin har bir cart itemni quantitysi productning stockidan kopmi tekshirdim agar kop bolsa BadRequestException tashladim yarim ozgarib qolish muammosini yechish uchun esa order yaratish stockni kamaytirish va savatni tozalashni hammasini this.prisma.$transaction ichiga oldim shunda birortasi xato bersa hech nima ozgarmaydi

-------------------------------------------------------------------------------------

D3: buyurtmadan keyin savat tozalanmasligini sababi this.prisma.cartItem.deleteMany qatorida await qoyilmagan edi shuning uchun bu sorov bazaga yuborilib ulgurmasdan funksiya tugab ketar edi men D2 da hammasini transaction ichiga olganimda bu qatorga ham await qoshib qoydim

----------------------------------------------------------------------------------------------

D4: boshqa odamning buyurtmasini korish mumkin bolishini (IDOR) tuzatish uchun orders servicedagi findOne funksiyasiga currentUser degan parametr qoshdim va order topilgandan keyin agar order.userId currentUser.id dan farq qilsa va role ADMIN bolmasa ForbiddenException tashlaydigan qildim controllerda esa @CurrentUser() bilan hozirgi userni olib serviceга yubordim

---------------------------------------------------------------------------------------------------

D5: sana boyicha filtr doim bosh qaytarishini sababi gte va lte bir xil kun (soat 00:00) qilib berilar edi shuning uchun deyarli hech qanday buyurtma bu oraliqqa tushmas edi men buni tuzatib kunni boshi (dayStart) va ertangi kunni boshi (dayEnd) qilib gte dayStart lt dayEnd qilib qoydim shunda osha kun ichidagi hamma buyurtmalar chiqadi

-------------------------------------------------------------------------------------------------------------

D6: N+1 sorov muammosini yechish uchun orders servicedagi findAll funksiyasida har bir order uchun for loop ichida alohida product.findUnique chaqirilar edi men buni olib tashlab bittagina findMany sorovni ozida include:{items:{include:{product:true}}} qilib qoydim shunda nechta buyurtma bolsa ham sorovlar soni ozgarmaydi
