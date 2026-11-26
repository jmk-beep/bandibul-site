/**
 * ==========================================================================
 * 다음카페 → 홈페이지 「소소한일상」 옮기기 (CafeImport.gs)
 * ==========================================================================
 * 대상: 다음카페 반딧불단기보호센터의 아래 세 게시판 중 2023년 10월 이후 글 63개
 *       (동,하계 캠프지원 / 사회심리지원 / 개별지원) - 사진 499장
 *
 * 사용 방법
 *  1. Apps Script 편집기 왼쪽 「파일」 옆 + → 「스크립트」 → 이름을 CafeImport 로 만들고
 *     이 파일 내용을 통째로 붙여넣은 뒤 저장(Ctrl+S)합니다.
 *  2. 위쪽 함수 선택 칸에서 importCafePosts 를 고르고 「실행」을 누릅니다.
 *     (처음 한 번은 권한 허용 창이 뜹니다. 허용해 주세요.)
 *  3. Apps Script 는 한 번에 6분까지만 돌 수 있어서, 시간이 모자라면 1분 뒤에
 *     자동으로 이어서 실행되도록 예약해 둡니다. 따로 누를 필요 없습니다.
 *  4. 진행 상황은 cafeImportStatus 를 실행하면 「실행 로그」에 나옵니다.
 *
 * - 사진은 드라이브 「반딧불_홈페이지_카페이전사진」 폴더에 저장됩니다.
 * - 글 날짜는 카페에 올렸던 원래 날짜로 들어가서 목록이 시간 순서대로 정렬됩니다.
 * - 옮긴 글은 카페 글 번호로 기록해 두고 건너뛰므로, 여러 번 실행해도 중복되지 않습니다.
 * - 이 파일은 배포(새 버전)할 필요가 없습니다. 편집기에서 실행만 하면 됩니다.
 *   다 끝나면 이 파일은 지워도 됩니다.
 * ==========================================================================
 */

const CAFE_IMPORT_CATEGORY = '소소한일상';
const CAFE_IMPORT_FOLDER_NAME = '반딧불_홈페이지_카페이전사진';
const CAFE_IMPORT_TIME_LIMIT_MS = 4.5 * 60 * 1000;   // 6분 제한보다 여유 있게 끊습니다.
// 다음 사진 서버에서 가로 1280px로 줄인 사진을 받아옵니다. (원본은 장당 4MB 안팎이라 너무 큼)
const CAFE_IMAGE_URL_PREFIX = 'https://img1.daumcdn.net/thumb/R1280x0/?fname=https%3A%2F%2Ft1.daumcdn.net%2Fcafeattach%2F1JBd1%2F';

const CAFE_IMPORT_POSTS = [
  {"key":"bDaO/137","board":"개별지원","title":"2023년 10월 생일 지원","date":"2023-10-13 16:31","images":["3c76f904be1e60003ea674b89e16b7ce5a828b55","f9882557f16b0de32f304d3948f19b85f8a14139","7acca07c3d81c31ee4c837d46c537a3c95f03489","e0328e56bad88ac344a078c70234afb55bdd95b7"]},
  {"key":"bDa9/178","board":"사회심리지원","title":"23.09.27. 가을 알밤 줍기 체험 다녀왔습니다..","date":"2023-10-16 21:26","images":["f13b03bdb8d39fe38ff424972a9d86dea62d8217","b59e492a5fe5b09ce383a8f19e69a3db4c6c0180","a4c9200f732e3555b9fa49987fc6e573ee808be9","07b9e7b31028b32a5ce045dfd3a38c31bf5669b4"]},
  {"key":"bDaO/138","board":"개별지원","title":"2023. 12월 생일지원","date":"2023-12-07 15:18","images":["d8b0732a51246cdf07056c1183070c3c383fbe7e","97b19d903296174080e78caf49a285529ff47ccf","54ad7e248ae4d35449a50da84f8b9ef0f235f4bd","82708e039e2ad696386bc4d1e2710bfe5498ae58","d3b4ce95c1d96c04d5daaf0308588d39dc6c823b","a8729d1accbb569a6b89f5f06de2ec9090dc92e4","9b265336b46ae869041d3b110b05584fa72a6e99","f313e7476c6d2420160b74c73aa25b39b14b9f46","73b0baea00ae5a1e191bd3eed429a954ded22e93"]},
  {"key":"bDa9/179","board":"사회심리지원","title":"23년12월16일(토) 산타잔치 지원","date":"2023-12-21 13:00","images":["164b67c852c9b84159a16f7ef6a5c4e185dc2504","c7aacd17210b12da5afbca63db269fc1d70070f2","315d92fe7d87d62cf2c44717be10cf7583862af7","ad3315ba674e5c206f925ce6af214dd15e968800","1748174719bd7a855a2d51cddd26f0b132184c57","7d6376c6e5a2aa2ec358ffa0a62ba83f679e8e18","9064582312d1aa3e047003f7a378e05df9918ab5","e44151ab9d3cca90b5e799eb3330ac72b10f8c86","a8cf03870a1aadf86084de7cfbf2bc16e83d984f","0997d25642ccb5ec979086c50c3af815d5c7b35b","4f853dbb859c4e0c8a425e3ca7eb695132494426","17e6da4025455858da9620579b432ffe518666df","916382136f5893b901638fee1999dd8df40a4f97","66a720c6c9e81266e768f9b8e281f208a0b8b55f","9f4bc424c21c2d1a47e58fe072b92b7f2d11288c","a914c8efde7aee8734a6ab9a3e5db74389806936","c7326769a24e8af8b30e969b36622fb9c48eda07","38521142480868941ea2f920c2b8f2e2e31e905c","566b94c1ed2179233c6bd9bc21fac95b28a87b9e","8b11f71d9f67c2b4bddb5420154682d639ad9226","1999f2be1de5b745dec37a007befb67975656fb1","e300bf3376926d98e3f7218e1f38b05b8b303e10","058192438a237a97ed236b279a35b0165f72e70b","d6e44f12d0fdf92e494ca1a91f27ec4c96cf26f3","e87b65f967ab54dc1ebc682baef07f4d9a6d5f3c","734bd72bb25aa70a3f5e6232a9d42ba892a449c8","d38d68985b16c801940fadefe8b97e9bc4760a9c","5026e39e4c8abdc55a0abfe3fff69cef75f43826","214028ad240f03a21b3c67b64611d6e509eeef3b","5178ab9cbd63d09f778813739c3085922bb0b5b4","237ff314e006a0c84e25ffc569c4a988daf84d18","a6ad1b378a33f37805b63fc63b9e1edd7aff8112","b050301dcc51cdb3ec4298a7795216d01f95a925","fff875553773cc203671c4554d7179cdaffda3f6","d3408be49e71e20a2a9e84287e0b81f41e1e1682","3faa8439a3d3d39096538b7d05a6659b54e8db8c","5bca2ebf204e285b28d7123cc7b0b40dae83084b","2c68459c62805399a2bf2d5bc66becf9d4ea71d9","a5b97e2afa6004391df620d153967b9cc0bb4425"]},
  {"key":"bDaO/139","board":"개별지원","title":"2024년 1월 생일지원","date":"2024-01-11 14:19","images":["c3ddbb4b8d0690f1923cc91ae87a3bd5c9c1048f","b3971b1d280ab66ab763a4c18874911635d94022","3f621fa6c72422795ae3f0729bf9161a073b48d4","2402df6d5853132a64dc1da0f1be8893a5fc2e1d","2e82ed098d2250a44bcdf7778bde3104d97e9eff","157ed15812e8afa6566fc76879592cc972d09be8","aa487a53022b652740e872e31a0547ee21c815da"]},
  {"key":"bDa9/180","board":"사회심리지원","title":"24.01.26. 천안 상록리조트 눈썰매장 이용","date":"2024-01-26 15:21","images":["1a1788dc852a2523ab15ac6e90df5d2d7bd7d0d9","b93731fcbe0ddf3411e311256d50d0ea82733537","4d3a4fe80b6796b00312e5535e0881cfbc695062","030710cb00185bd7fe3ef329945f837c831a0dc6","4a534e06c75c0c980edcc85bf07b1ce1265b23cd","453f952d81573d251bca62188b3f252cf8d208f0","20ac0a9fe27f695fafef6b68ff0a460e05b86939","eefcae7b9e28f4ff28aaf4204fede92b0e573c75","e136efc76a400c384b0c72d9b8bb1359d8e4a9f9","f8d3655f97536a20417b83ddf3e19da9ed7fce5f","d9b12771deb820b3ba4ea7a2bd6bdf275faa5c3a","7ac0df730b6fd9aa32a262dd58869461fcd14367","1cea7e7fab326b42f1c8227378e5cd4c2cad9bc7","96bee83aa22a363b5a4679ab32f3203e32b06629"]},
  {"key":"bDa9/181","board":"사회심리지원","title":"24년 01월 31일 석화찜(계절음식) 지원","date":"2024-02-01 10:04","images":["ebea9e897dfa48684b0da38fd6a11a5f85a7f787","0a6b1ce160bbd1d7ed6d47c6bb9b64cd24cc60dd","ec75497c7f6074cd613376960909c8b0c39302fe","5c7a1f2d3e2b75d441c02a17ca2934685f3ac462","2c7bbaaaf693fc2586c2b9a3d795d18356853538","04ca90a2b4e8cebf3d2eaacf0a8b61aa60319ff2","fc9253138452d913f53083b6d03ee2ae8e154a02","c2cc8212058eca1fd98c6c127d7a13496bb2373e","680658ad2571bbf0fa42f1d07de6353c9bbed94a","8aa93402a838aa1e4276ea37cdd4a8ee026784fb"]},
  {"key":"bLrd/61","board":"동,하계 캠프지원","title":"24.02.16~02.17 힐링 동계캠프 지원","date":"2024-02-23 13:29","images":["e1ee0ec318f862f081cb72bf7fe8ddadf5f2849e","281f45d25d90494995b0951e32d5aa7046ed07c9","1e842cd895366e840a8c46dfeb19f0ed2c65d57d","dc594f8b52acaf73d2da32a289f4d08ed2943937","8ff242b9fdc28e7d9e354af37a43307b7e1a581b","782285f4435f5d271f7fc12afb66d5c550296947","ec8cc5ae4eb2715c6780e759bb14ee710969a7ff","fc1e5e613029a026dceab877fd88350e001296c7","3dc798ef0f9755a12131a0069ead352a75049b5b","ab2147a9b861fe3e9b12894425d40e588c9fcd11","179972b79abc4c465ad62da13f621e507d02fc00","f22884c0fa40f61c03f468bec070b91980e71913","3bf3723ad1ef1ea820387501812bb23d4534ccce","7ea196b3f84893a965284cd1c4a51b346bcd353b","ad051e09e1c6560437ecc13a95a7150e62072683","fb3729db2758bb774dd724b7b60564f18c6cfbf4","06e0a9398c5e83f3d2a0602efa7b31a589a16150"]},
  {"key":"bDaO/140","board":"개별지원","title":"24년 추억만들기 졸업여행","date":"2024-02-23 14:09","images":["10f6a141ee2d0635affee434b3f8bc631f2a25f4","d7badfd1d553260774b2c830532438aeaa3357cb","ce014c34f1f7a62070c64d8e272704f6f608e06f","337bc3553777ccc1e5f5aa09d0032a0f68b654b3","7c43fe5428b65295cb6511e855552b0e96ef1e64","e33ab9bec26b30b3f01d45f56b2f827fdbc5e2b2","cdb03889523ae64ac9410e7db35da0da28df2c77","66b4fa006a82fea2affbb5154dcfbf314f3500d2","964fb8fe2ca3b0f841c80f74a37cdcf9ddc431b9","727c26e3b8e0eaf37fd4294061b04ce916816665","b4011750f8cc542d2423c95f31a5d75c500fb0b4","9ce43141fbb9b2dd92ef81fc4576bb9b436ce1aa","550a3c2b0835b658ca72a77f31de0c804c11186c"]},
  {"key":"bDaO/141","board":"개별지원","title":"2024년 2월 생일파티","date":"2024-03-02 08:35","images":["d2dadf8845c5b0c83de8732fd796ab0238fc4006","92cd0fafc989cb51d63baeb1ecf54cf51efbe796","6b4dd702393eafef2686bfb66425b506c2038e62","7f384f4cd25dbfa2101dac18f702e13c5daec74a","07385137df8de9da69b5cd433c439a67e2831542","68083795a0164050655c0e5be4c8e0fac7af1a82","e5a8a8aa626bc6bf16725bac02fb1905cfe5d69f"]},
  {"key":"bDaO/142","board":"개별지원","title":"2024년 3월 생일 지원","date":"2024-03-15 15:44","images":["5557ef9ec631180d6903afd0e20242cb391720b7","d82b06d1d8f071ed3d7c91b8d2439ff99024bb21","a40f8dcd6aa28afa567f7236bb01c83d63486e08","b10f2f7ccb3efd35dc04b7724533afba595ce070","4ef97ad365a42981572dd02c97ad303048682dc2"]},
  {"key":"bDa9/182","board":"사회심리지원","title":"24년 05월 30일 당진신리성지, 아그로랜드태신목장 관람","date":"2024-06-04 00:19","images":["6077637b234ff7af29a516fd24028536387ab28e","0d20bc920b6e413d724be7d1829afbfbbaaca0e4","7e1ec2465ca0f5a2960ea113e5fca0fc16e23395","3e814f0944d81cd8f6ede095eead1ac5dc21120f","d800f0c70bef675cdef79ecbf0044bec85113bb1","203d6ee035d1491793600979c3bf6a999debb51f","803fe4550f4fb7dbeb6846d10affd50475c0d7e7","32e981e7239332bac416b37429be241efd3bc8ce","371e7d499dfd647a59734c78ec2d803207a94d94","2f59f9d0a32023e73de1d10b0d4a561bee6576e8","5d54d1c68033601dcad0fed6f15343af0fbc46f0","4e60b9b72c1f65047bf19145359af2233c358aaf","34e13cfad807e97cb0cc8baa9cb5c7e919f39220","c3a817cb14e795c49160b3ee3304e43731be3ca3"]},
  {"key":"bDa9/183","board":"사회심리지원","title":"24년 06월 21일 충북 괴산 아쿠아리움, 증평 보강천 미루나무숲 이용","date":"2024-06-27 11:32","images":["d8847abb576e66b6b31e5d8f372b39986464dda1","c7834d776faa54fb5773352bcdccda601707c072","d553b968fb0fab1b60e6ba3e6a12152917633d68","171ef4e3f990c649696a7dfd37175d6522206884","926b4f7daa28030f720fe7c314099d3cb09bc114","9476bedeff3ca9cc8741eb9f30d57553bb9d3673"]},
  {"key":"bDaO/143","board":"개별지원","title":"2024년 7월 생일 지원","date":"2024-07-02 10:21","images":["4bc9d649e4cd8c484b753c3ca6ba6a991a4199ce","b74471ee2fb1caccfe491372920dd0e39a70ba80","1c06e3490579fcfa1fd77da4b397d755d40aa28e","7474ec03b7cd1c2ca925a6b9325ea8f379514620"]},
  {"key":"bLrd/62","board":"동,하계 캠프지원","title":"24.07.19.~07.20. 하계힐링캠프 지원","date":"2024-07-24 14:14","images":["841e6d3f66246a47def49f9d58493238df60d43f","d526dc7f25d62cab6b26e5213970b3fec9485d5a","c05562f1733e142b4630ea358e3d3f2b0ac6a1b9","3f1a21add6369dbbf3062ba6eebcc7ef728d8c7e","b43e12f07d050b5fe017f2a9d0816b384127019a","ef582d762aeea778761443b6ba67018114904427","f0d8b6f5ff9a20fb2847756671d9ac4a6d2236cb","c9ab95a0e259bfa0143f663ab71ac50a6447dc3d","58d75b746071c421e7eb1fb525673bbb0c336cf8","3c4b8b69fda9250270098bb5b6043a0c8aa07916","b5c81c88d2fb71cba9abc3b756b8da91c8e750b2","112cbd4d795941bdb9e2430826c8efd5a0b6c020","edd402e7f997c9be29cd30fea9f56f81c83dcd1c","6725b1eef1d83a5c4e811fe5fdb04463d2545743","970c6832d6cd768f2b3b4719cb0ec48942844597","3f3218a66928e8b9da544b64ac5c71e81d963019","329be908658959bf0a4c1119f9925d766e15c6b9","dd4aa89941c4d5f3ff134250469ce627cb50de28","4a218cc4594d251dbd1e804511dbae42b6349659","0d65a0e920f7b69e4066ee79e65f984c69c07a5e"]},
  {"key":"bDaO/144","board":"개별지원","title":"2024년 7월 생일 지원","date":"2024-08-06 15:19","images":["1a3854cbdfb7be3d1680f38dca0142f5985d478e","ab06f522ac1626c0add75a44897d5bd85b51e1d2","bf613de81596cb65866552cca83509923438a82b","da23bf128f222427e671e7be019f9d89fc3b3343","0820c62271a8718b98d997f2a170bef3c75873a6"]},
  {"key":"bDaO/145","board":"개별지원","title":"2024년 7월 생일 지원","date":"2024-08-06 15:20","images":["445c5eac6bfd3d1578b79c5e6e717301449274a1","71dd26172932062685e67c371edccff74416f678","f328d42b8d8c0ad56fd416520aa5506aedd3fdbc","57bb6b279517005fc810feb9c9fabea5fffc14da"]},
  {"key":"bDaO/146","board":"개별지원","title":"2024년 8월 생일 지원","date":"2024-08-26 15:54","images":["2cd84211a371c1108e15f1a5c95a846397a9a54f","1ee0e933b5cade83ecc0f2583ad3968594205ba3","01a39242f8319480a4bc09de9b766b42bc79425d","304a285e4e5b0b6fbc5b53e8a730b62c3ae27641"]},
  {"key":"bDa9/184","board":"사회심리지원","title":"24.09.12. 명절맞이 송편 만들기 체험","date":"2024-09-20 15:38","images":["4e2f44e07fc4b99c38394056328ca13f8193030a","c3e281e3ff58d211b9d0ff2a72a357be17dcfdcd","2037556c87fd55113a5d76e719ce1e4ff3060d69"]},
  {"key":"bDa9/185","board":"사회심리지원","title":"24.10.09. 계절특식지원1","date":"2024-10-18 10:46","images":["39ac1401a6e1a26bfb6e80e19854aef9630d35a1","e89d727d372e5604d31866fca14bc4386558b25a","ca7ab100196f93da313acbdcbc4f59dcf2d18135","ee8a95b829016bd6c766be3b54d03ca88103de53","2191b8c2b8decf31799c46d1550475e6b3e6d536","c3922aac64dc71bda9fa469dce294ea7041c70eb"]},
  {"key":"bDaO/147","board":"개별지원","title":"2024년 11월 생일 지원","date":"2024-11-12 15:59","images":["a9d92ccaa09272e1d13b024c9ff21b03841bddde","b5daf736bacdb4df88f04f980b96cb30c268fdf2","002af446dfd8b91b76d42ccf195d65f04105d9d2"]},
  {"key":"bDa9/186","board":"사회심리지원","title":"24년 12월14일 반딧불 산타행사","date":"2024-12-24 23:09","images":["6f8116340f6483148c7ef92e28269c9a735bff08","608c8c8792744b09228dc90e36a352b7040d0fe5","f00e884bdf2ab0f64065346380c06ed4629c8079","c30b737321d616053ee3f64257eb5fa7c354152c","786c8d16b2f728dc405a0ba8bc87b4ca1eb10c79","d726a9179b1676109f8cc4277e4680a6f23939be","31ca637cbef7730c8aa3bfedf32a434471f1897d","dd4de31ccaccd1f408c00a011adb3c445f0b1860","bbb200802a62f9b69ef503b1351929eb474646a0","20387a59323826f267d18663878f24dabcd5b663","eeb962dcd756e14e768572a7febee8690c79b9c0","0714034c52f0adaa4218805515d5a3202426ce20","5c2642790427e7442c0096f7f92f6b45c9b877ae","89f7725970d8af54438d7df849a85d8d663d188f","89b9b6b58fb85bd9167f3195b9ef92af937e71ec","a0deec1d4daee2b78bd156de39b7c113ece60036","9bb1dd3abc4e308cadc60c0f22bda38c8986e982","8c3705e03ada1de2aa626dfd19220c1e2c8c28ba","9d3bf908456c0c29ffad4c9e94b822ed60c3f306","4eb8714aa3022d0bfe02eea840f4bce78e91d67c","048671da75bc6f9fbc046b1b06fabd7b4674f36a","86033a6946aeebeab0ed0cb5a363b27a0c46245b"]},
  {"key":"bDa9/187","board":"사회심리지원","title":"24.11.02 자원봉사자와 추계여행","date":"2024-12-26 09:58","images":["38f5f92d468d666df71fc02a562093d5d7bf1adb","8b7f010fc98c5acda8feee438ead21b58a2fd66b","1d674cdb191028fdeb4d994f895c2292a7de5e1f","4fea64986e24dc28585185a6e8018aab6169dd8c","daefd1492062e2ebb1c08415f0800e8daf5494d1","d4ce068efdd7c0dde9a0cc8e6821b7ec48397460","86d9625299c3f4fd330ca1eb7217140e9b5e8724"]},
  {"key":"bDa9/188","board":"사회심리지원","title":"24.12.14. 산타행사 지원","date":"2025-01-08 10:19","images":["1855845a4023c4adb627c1e3e04114d06ae90e57","c60c912c100ab06defa5e6aab813f4fb5d01d0f3","97733aa143db95eed592a6a27f11cb2ad68cd410","36cc48d008ef3dd65a1fdfb861e1a8e2a831fab3","feeb79056376c7fc4a0a0a3f7c409b1e7f8c3ba5","571d0af70939d8d9e930ff268fc3b535588dde6a","ef479fef0fec8024aad8bc071b676da000c865da","66180927350f33040bec788196eb3539332a9562","26a4464a13926e25b4d47abf9b75152030c15c81","cfb39d4ecc0882777de474a0fa95a5fda9550c16","6393f4cf75c73b1ea89dac3864c4c1d8d36fd095","e9c22566614e510c43efe6a166c6c510fdbad672","cbfaa339d10b378acfc0648aaff336c135e805ff","8ddcb61e2c000e3cc2ea7bd149452a7844903703","ed97a306781ed842771b019730cc2286d6dd2b5d","5697282fc83e36f6f1fac8cdeeaca93f2d70e365"]},
  {"key":"bDa9/189","board":"사회심리지원","title":"24.12.14. 산타행사 2","date":"2025-01-08 10:28","images":["fda14bebb1b6435a8191a5320865583748c80ca9","ec531af275988a3a2f7d4ae1ed061526eed5ed79","5865f74e3662ef688b441e8dcbc80901ed0cbae2","06f2c5e21932f38fb5b68eb070d48fcfba2b5fe3","c3e3212c0443974ba44f8db124b15b85f970697e","318f2658347b071f17297d834764fdd4ba73254f","4c086d4c3c38982d13df056e7334ed9a657d08c8","ec5354cbef3308f1059e966b7807162795cc043f","18b2d1a9d48700986515837f43ced19db165f14d","35992d8e6a9c1459fd3d8110cd6813ca8082a43b","66ad1da8b71c9f5ea3d8658a917d792ae99dbc91","23142ebf3a2aaa33768192a9b324b08c78b8c451"]},
  {"key":"bDaO/148","board":"개별지원","title":"2025년 1월 생일 지원","date":"2025-01-13 15:02","images":["aebba067be8065a6600fefc746dc56c7340136ed","9deedb19f2649ad36e1f470d018d598017cf69d7","9281b25d0dc7b0e7020dc41fd4e957d82c047969"]},
  {"key":"bDa9/190","board":"사회심리지원","title":"25년 설날맞이 김치만두 만들기 체험","date":"2025-01-24 11:42","images":["ba87bd98f6676a6c71ac09e0f08b4c4b00df67ca","35d267c4e38bfa4ce58dc8e7cb728aac468e7b84"]},
  {"key":"bDa9/191","board":"사회심리지원","title":"25년 2월03일 사회체험학습지원(눈썰매장 이용)","date":"2025-02-19 23:39","images":["87d927af153a64639688cba48d0773956792c97c","86556c14c08cf57c8a6419d8cc3b70743e5025e5","3ecf428cd36d46cc0a7815884c2acd4dd72cd0a4","761633cc73c7f48e4fc20e9e83c2aad87e1f7915","a58368023fe12dc26af02170ec04823e5b9cbe71","2ff144f6691558745b11f86d1733fa0d447eba18","8fee7ba6d10c73ddff60ee34619f7a56e4706755"]},
  {"key":"bDa9/192","board":"사회심리지원","title":"25년2월 14일 계절음식지원(석화찜 & 해물칼국수)","date":"2025-02-19 23:41","images":["fe7ecc3c57f6db92d73f343c382b36c52e2acd89","06a680f235bc43239cd8a76fa8716016949cd0a7","736e068ff5624d715c1b2ed4703befb2d8aa6906","28d52d0d1979b07f940a1d3faea64023c8a4cab7","66c7e3d345aa1159540b5300e825cd49b5e52ac4"]},
  {"key":"bLrd/63","board":"동,하계 캠프지원","title":"25년 힐링동계캠프지원","date":"2025-02-27 21:40","images":["b1e7965ba39e868d032979e3b18e64b8428ef4c1","31eb2460d30f288c7f46b011e5d42f2fcb135311","5a7958923683283fd6af76fb53dce08266699bbd","5f93aeffd169d9c5b5ff2b9b54e7b1f73a76bafc","20aba24ad23504cf29700c06fdac4d1c8e687059","4cb8d44d4e83dc34a21e9a9a8d37d00d0f3f262e","9896925509fd572bfc3b9c75982218a34bac0fde","d557f630860d6e2b59bbc21a45cb47cbf0f57190","e0ba8c922744521596dcac71286cebb0bd9bdbbd","4e0c80a3f4847ed154e40b0dfe20cbdb2752c2c9","acce32231bc500d13440b7d52c513b3f71e47438","113b66422da33c54291920cda67840afd0f684e2"]},
  {"key":"bDaO/149","board":"개별지원","title":"2025년 2월 생일 지원","date":"2025-03-12 10:51","images":["7bf6f0e673eef7f4af090d91b7f8cfc952cc18f0","9213fef6b0a6c6740e73b5742190a255f06eabdc","9427d3ec507ae8ea8f808eb55fec8e687549a5e6"]},
  {"key":"bDaO/150","board":"개별지원","title":"2025년 3월 생일 지원","date":"2025-03-12 10:59","images":["1537e7cd5c5d560662353696146b1387e85ff844","8243fb2db31de7ebb159d72debfc23f1a1fe7177","30d999c3274551a1aa41a1f9e69ee348ddc28101"]},
  {"key":"bDaO/151","board":"개별지원","title":"2025년 3월 생일 지원","date":"2025-03-18 10:56","images":["7e9d2c037554d04d4c72ead85686a5be1da6656b","841ca5a2ba88fddf3159cc22c529db3384a29afe","08612c7ea1929ac4703799243f6d9555fe5757fc"]},
  {"key":"bDaO/152","board":"개별지원","title":"2025년 4월 생일 지원","date":"2025-04-09 11:02","images":["509f101aa8760938ca20a07ad17a05e31d229740","2d327c5e44b188c596dbdcf69e3d987895c29708","c2c8922a1301e6f60d0b385cf0921d52a5799c80","0ffa267cce2f74f8e5dda3d14ea531aa150ce332","6f2f972a30179da601630c3fe51b79112c035f05"]},
  {"key":"bDaO/153","board":"개별지원","title":"2025년 4월 생일 지원","date":"2025-04-17 14:44","images":["35e1256c8d3794840590494effda31413b75a6b0","7ff2ced9d9a6c35013445e2b0d2c2f17c471fcbb","60aacb40f569623c291461f0e805390fadcee751","58ce27238c821562bcb8f450af9de5a6a47604cf","2041e63c231b005aff02594a52898c8ccc8e9930"]},
  {"key":"bDa9/193","board":"사회심리지원","title":"25년 04월18일~19일 키즈풀빌라 체험","date":"2025-04-21 11:33","images":["f079d4418ac163a770bf8aacf45265a8ff80eb3c","fa01662a9bfb92f36a6f856f980c793c88c50e83","59b3a11edc552b37ead7ea006752c225ef84fc2b","0a70f301f58f1e7f3dd17fe82cd5ac42fadcc27b","294309b6fff8233acd1d313a3ddf5073eea4c50b","55f8ff8ad601dafc6d0fbc8d0c765873559193fa","ea5edfeb8ce61ca5f54030f4984029f94a234551","49fc85778011dd34780da40d73b7dc0bba2ad124","f8a32eb1fe9e80e7d47ecadbe8a05379eb8c73f1","e1c5d7d63bc1bece2b156dd98aa0de9ec111743a","cd0bed15366220a28be6770c64382042b2bbd528","61eac3ab5003629d2a65a28153e431341cd49f0d"]},
  {"key":"bDa9/194","board":"사회심리지원","title":"25.04.26. 한국민속촌 소풍 & 어트랙션(놀이공원) 이용","date":"2025-05-16 10:15","images":["8da7666da04e8e410ee58a3b3af0e90bc229f476","e1b395a92da60ad80a0f53876b017274c9fd1736","b1b31da9924a4a2ac869c7d255b6e3e539349059","a5e9d331d7802ce9d08f591417046948b9fc9574","ba5b484e2a79ceeb2598cb4cb7b3edf731c31e8b","45469c1ee60d327d9125305878767b9245e126ba","2ee5058d1536b15175ca8a81ba1161e6f920a047","57a1c991e60f92c7e95831190f4b7782707a852e"]},
  {"key":"bDa9/195","board":"사회심리지원","title":"25.04.14. 계절음식(석화찜) 지원","date":"2025-05-22 09:55","images":["b3264e0c6c5047be4d37277c56d6b2284333da93","23d919561012a762040697cf6a61dc922d384783","51f6f1407dd36ae07d2974c0801a433677c3c66e","f5187399911c8703fa31c42e7509100250935112"]},
  {"key":"bDaO/154","board":"개별지원","title":"25년 이용인 지문등록","date":"2025-05-28 10:22","images":["fee85a9e299a5f32d30888ea2655a88269eb627a","7775993fece8e85f554cac40a541f006bad490a7","9563c319f3bceda36ebc1e95844366ef08f6f0c9","5d8c7cad8edcbee8d9b134ed77fff345e1897dd2"]},
  {"key":"bDaO/155","board":"개별지원","title":"2025년 8월 생일 지원","date":"2025-08-26 23:08","images":["3d7bc9932959705bfe0f954a9315cff513ed5f3d","a38ffba35df8bbfaa8fd3ca699db82e6033f1936","fdb2bbc5d643e572f54ed39075f2b6d86b3df8d2"]},
  {"key":"bDa9/197","board":"사회심리지원","title":"25년10월 02일 추석명절 체험지원","date":"2025-10-10 16:23","images":["1cd1e672a16f8396dec09cdc43d251ef44c3531e","2c9fd8f8b45a05c3f17730f6e9a828d5d8931209","2cc3e5045b39bf416deb6afff764c0a6cb30044c","4ae22184c28ec3c72076b779e18089f40bb63a1c","7daf3c70923ff3c33c5dde2c4871782446f19068"]},
  {"key":"bDa9/199","board":"사회심리지원","title":"특식지원(대하구이)2025.10.20(월)","date":"2025-10-21 14:02","images":["1165a4105c2a54871131bc800e663ba641060ce3","01ba5b36ed80408ca8463b217945192fc6dfcf50","b0231abb67ef3c6a38568fa4b353f6c5e700b38b","48c01de7a3c565bc923896888b4ff94bb1e2145a","080f378e73df5fa310ff1aa14f2b560339280fc9","677b9bef8bc707bf4f6c74efde9305fd3fc14f1c","bf854f72b34e60ad7a6594690a97c396ebedf3af"]},
  {"key":"bDaO/156","board":"개별지원","title":"2025년 11월 생일지원~~","date":"2025-11-15 15:58","images":["94919e85627aa94cddc5c035b55cdbdd518f615c","98da9afe185c0685581701b834c43c5f055d4017","d489d7ad61c26169ce8d40dc461590850f3f645a","e3cac233fc10353f1b45354a932e0eeb2b938422"]},
  {"key":"bDa9/200","board":"사회심리지원","title":"26년 02월 13일 설 명절 김치 만두 만들기 체험 지원","date":"2026-02-20 16:24","images":["8b2467a8ea66a2ef8c9e148872f6b47d4c99b55c","5cc0551c5d3510d97a85a623e8f6e8a4ec4c8f18","62b4b3a9e298f3ad8867ef6a9bf36d55dc139fa3","6da383ead6793887487fafff7f33abe4772b47e8"]},
  {"key":"bLrd/64","board":"동,하계 캠프지원","title":"2025년 하계캠프","date":"2026-02-26 10:50","images":["19152b0a08246357ffd4d574dd07bafbfba2f359","994aaa9d0f438d96461c9d88d04086008f839e5d","18a5919c8fc596cb5709c9c883bcd93ff0d65550","d31767a34c01af19fb2c81c06ea176a67563bba3","14dc0e8932fa13f9bcfa5f210f1ba51342e0bac9","216c2a07d74df1ccf3700fd5b5c1fe64b9b24da7","17f97e6e4fe526043824f90d06f2286b6aef1be8","ebcd2af4d5c8e81966839e82be85be5c44cf4be5","754b97c94fcf37791440708c58ed6432d58450f6","20d0fdcbae9e0cf5aafed97dabc584e8227fa8d8"]},
  {"key":"bLrd/65","board":"동,하계 캠프지원","title":"2026년 동계캠프","date":"2026-02-26 11:29","images":["1b8aacbf06a8d154b2019bece8224f9d1f96aa0f","eb4c0d6a58b49aff95c8cc2255c0c9d57ac9b70b","85ed3e12b3cdf00eb7b8577e03e67159f43a1178","b48def8a42cf1b8c7b33f3e383bc1ce149f7b128","db32f23d7353c84287defe639ddf49e62084dfbc","4d19e81831549b0e453216b6c535eb4592054d35","4ac372f8ed1308be99a148c2431c70f435719aaa","b0acd52f30276c0c5b4059684a45abcedb5142fe","78c75398a504886cd9f6002bb6ed755f45ae7639","4969ab2a6d250a49d580c86cd46a13b6fb0c6aac","b952102425d1ba99ac6b675fd43da0dc14497687","bb0d946035079f0fa5e162a59f6f00ff83a98b1b"]},
  {"key":"bDa9/201","board":"사회심리지원","title":"2026년 상록리조트 눈썰매장1차","date":"2026-02-26 11:38","images":["9fa31683e8f43251264cd03ec50ed92f6f5d376c","affc00d40221215b217d6fd7c141819b928f0417","c9be2b9472740b5f51eec44adb5ef5d1c6e10a2b","70c9a276c5ca6654383232ae2d30a6593074db5c","037bd1fcf3acf28b601fc1aeea58e6967f9358cf","784ebfce3f9e1d3f4a84bc93dbc2e1fb8142c3d2","5a7133baa367df63149cd10dbb191402cb357bc9"]},
  {"key":"bDa9/202","board":"사회심리지원","title":"2026년 천안상록리조트 눈썰매장2차","date":"2026-02-26 11:43","images":["9831fdcdac0615b51eea0ac9fa998498b0179c77","83a14eabaf33336a2ea32e21f2c00fe27d30c6e0","762a86fa020bacef36cef80a33f8546178793cdc","e726eeb6825a36181bc250be7bc86f7f41b2b0aa","7ad97b8fca1e9a9cd232544a1deced832c7d8cc1","b40c5fe73c552c93a307040eaeb0d235f13d33d3","e47b974bf9b6d2468a96ae4fe612d89edbbc6e95","3484230cc912774f6bb826abddf16798c557598c","cc7242fb8df0e687e17dc8f553d09381c9dc01d8","51cadd07c22c0a78f46a43b7be1b0f03ba1e203e"]},
  {"key":"bDa9/203","board":"사회심리지원","title":"2025년 물놀이체험 1차","date":"2026-03-02 09:50","images":["98d97ac2da7cabb6d8746056d7df52e551f308f8","39b608a5d57264beadbf69f5262ad03273356978","ea27ac03429dc03caa1feb4205b7e939af25dc88","cffff83bbcc103da3b31ab4fc62a58091307f9c4","5ccd2055a75ca602e1677178ba23199bb6cf4c97","037bf9dbd22c94bcc40784aa5ec2342eee0366db","cd56c07589a3f816b3e30550a247b4b643598fef"]},
  {"key":"bDa9/204","board":"사회심리지원","title":"2025년 물놀이 체험 2차","date":"2026-03-02 09:56","images":["d4d7903aa758d07ae786c35c95e8c51705be3310","bd1fc3fb408d8be70e85eb496f3c04906177a5a3","5ec5f70c83ccc7be6702fae550bd13311a49839b","2b8277326791313a09048aaa63c6a781417683d7","7ab521b1440767a4a4d809da0b03dfab3f10ccc5","ac290b3ad4c44706020bbec3580c9ecbd92b5697","f86a4adc43565698a810e84fc0585459ad9e1a9a"]},
  {"key":"bDa9/205","board":"사회심리지원","title":"2025년 버드앤쥬(작은동물원)","date":"2026-03-02 10:01","images":["20802cb9ba517df7161cddad42e0750703b5498b","f45a01503a08e79cd01bde0f42176799d6156f52","302f8805973801cab3606042a30466d47b0e6a70","4ef5ce1116c4c609f1dfedcfba85f3827d2db688","1f1fe38cc8dcab801c506faa735185602ea9ae88","5cba066cc6cf5724fbad56881dbef32e44ad8baf"]},
  {"key":"bDa9/206","board":"사회심리지원","title":"2025년 장항 맥문동 꽃놀이","date":"2026-03-02 10:06","images":["8031365de73e8166ca395d81b9abe7cfe8fa9b77","60fdf71ffbf13454e7a050f1603726e948e5f954","8379ab3a84cee90bc2bb3f9508c7377f2c91a749","fcd03442c931b32e56f274d5ee198e8100c8e339","31d055ebbbd75dc0edccf2383b772e52bafb5c18","25139048200c4e58c79e13e6efbd660ff82ae003"]},
  {"key":"bDa9/207","board":"사회심리지원","title":"2025년 천안박물관, 천안삼거리공원 방문","date":"2026-03-02 10:12","images":["c015b1837e2b776c5006cbcd598de1f8cfc7788c","2cc5873e1a6d2df2a5871fea109c8060a3215ee9","42b406d7ea1feda7bf9767e410ff9348f3991238","4c3a7483f2ece896c81dfb705a4fb3fe1f9648cf","a7c06d06667f6299db97fad4d161eda5c2915154","416200168cd44afd3cb32f4e4120c25b02214866"]},
  {"key":"bDa9/208","board":"사회심리지원","title":"2025년 밤체험","date":"2026-03-02 10:17","images":["6dce4d047d91752aea39c5e3a6e93b5a57968f84","7ca6451e9d0bfc4405ff8705951a6b56d210281b","a3f880fea743aa952fb91fe8154f20b136b9568a","b9bc9e1e31efeb7bf32d8f92791aac32eac96107","982d355b13b89c47f53734a4c78ff20f622b14c5","44f69e8c1adf0cfe6979b46997b8fbdbccc250c5"]},
  {"key":"bDa9/209","board":"사회심리지원","title":"2025년 태안 청산수목원(자원봉사단 따사모)","date":"2026-03-02 10:21","images":["e45ec3b5f76b9a1285e482a944a14435207b5d87","8b5af1be20cd1eeef495f1d9f76af861951cbfc0","04f24c5f519b77576f8ec31978f9d7e4c1eee093","da25a1012ca87cc6351a90a210435b9a4fe2390a","7a22b396b24abb9a8ba91889062e11be3849f6a3","00cab31f91432b836fe6197c06282f01896fd87c"]},
  {"key":"bDaO/157","board":"개별지원","title":"2026년 3월 7일 생일지원","date":"2026-03-07 15:17","images":["7dc5f10f49c2a1dc7e6a25fd05efec22df8c350b","cd75f9a2d356ec3f8c233dc1f42a0fe79fd4bb0c","c3e005c1f4b215917f52d6218d129b75e08836a5","f2c0b6fce76e00b4d40d38c4b8a574ed8fc4f528","13054bf3a8f8a72abd60094809eaf9ad96594d8e","892f7cb76a1c457ba23cf3d1fd37e52baad4d883"]},
  {"key":"bDaO/158","board":"개별지원","title":"2026년 3월 16일 생일 지원","date":"2026-03-17 13:56","images":["dbb49ded95bdea697ad0b52cecf1192532d552bf","329a40d95432c5ec09668f56fef6b64b9793c12c","e630675001c9911296c18b6ca28e8b2d942e73ee","802768a8f5908c32ff87dd7c40c37624210d7c31","fd1af0cc953fa7bf945c6556938d2bde89c63d73","e1c0ec8ef5136fd07ffd1861005e5979d143e70b"]},
  {"key":"bDa9/210","board":"사회심리지원","title":"2025년 산타행사(자원봉사단 따사모)","date":"2026-04-27 08:23","images":["4cc98552e6e18e6efe70735b16c69a8560cd0a97","d07a8a51a2f87c8425e25eb77242a783dfb89549","77cbe216c9b65f6c06e1a36b9b0a794b9e903fcc","05b352f1472cf73869e7e83e81d530f79eda1272","430557c0d7f0c3d1ef6f9f8d3f3c29e7fb3aa05b","d4f28c968fceecbc6dab67ab6a2dc7308e5b8a73","ef0e889486c3dfa4822f3c371d42d96d6deaee5b","e28cf424b47a9a70d28bb6f3ac7b898cdf686cf7"]},
  {"key":"bDa9/211","board":"사회심리지원","title":"2026년 파주헤이리마을(자원봉사단 따사모)","date":"2026-04-27 08:30","images":["7e8e1f93d8a0cd2db47fd38c9b382a99644a2e0b","f53ef2585b5fd620b186403887021035a2cebeed","f3f4c143429c4dc0f5528da77fccc5a2dedfacca","e0a65a424ee012475abef65f1e18730b2e2776a0","9f359e352a001b1fb6dc681b2d56f41056501b56","17fd18702f102f498893a17439b66ee16e13f195","eab77c424979629d4bf40289b249ac341546a347","043a9c0e8b7e84c7097d7907a578437a27985700","eff51f76b211228de7a5951cc836d08ad5fa5f83","9a174934b6c6d063a0911b8c5ba7bc7a266da3c5"]},
  {"key":"bDa9/212","board":"사회심리지원","title":"2026년 맘맘스 피자 만들기 체험","date":"2026-06-04 09:57","images":["2b0b7a7fd2e8686946cd1ff4cd7573327b91cd7c","94eccaa1d60e72a059036b22f3eb8a14c226f435","068ecd15fbc8c1094d45d114ca116a5c50cb7187","05fe6a0c28acb53b402c2b342be9ccc57e8255fc","4ff0692a17cdb627be3215345ad185f74c2c0f31","a54b148b258bbb2e7526d9d10918443708e3957f","8acd2382ca75bd77eb007f288004dbce999b994d","4229134507ec774ef97dc5455063f62abcbea7bd"]},
  {"key":"bLrd/66","board":"동,하계 캠프지원","title":"2026년 하계캠프","date":"2026-09-15 07:57","images":["5d98192d6f10aa5b0612dbee2ca687ff7e5525fb","b68747c47c04cc63cf9ece4a273264b99c0eacad","a6d81adf8b40522ce74e90ab6d76a2a8e15c6bcb","588affaa08632ef8733f82192944c50cee4102a9","25963346cb506b083363da17a7d203e1ba785029","35090d5c2017da36a70666a07149684e6a1c87bd","e4f0796cb615e9f4d1d0a96ad5a350c11d282a87","197b623044ff1ef7d91860c3b4d05fe44a87d19c","424759e5b4302251a405fbcb7f6193c12bd30627","747751f22cb4d2b1508537544e221b748f791822","6e70870b7d5a116e66084db6e56c4e605247a842","2db224b75f8d607a308570b03b330f1b714b910c"]},
  {"key":"bDaO/159","board":"개별지원","title":"2026년 7월 14일 생일 지원","date":"2026-09-15 08:14","images":["86f320a2277e7d58b6922760acf4358f8016d9df","e22a996b630d73cc77b3c77c6fba6ada71e7ddfe","2e4fa779f2dbbd2382ff20c7a826f8af56017b23","356403e1055763ae6d752e11149b480d23327b51"]},
  {"key":"bDa9/213","board":"사회심리지원","title":"2026년 따사모(자원봉사자)와 함께 하는 사회체험학습","date":"2026-11-04 19:31","images":["8848f09229c00171ad4e00c7ff6cadab535d1597","a0e60046952d1642ebfdf97666a2b90cc70b1d93","85623ba9365151c5e12bfba4aa7b3b5cf96688cf","edacdf83b6a9692d7ba932b6c575042fc2834579","3b36de9553b2729ed326bb8124c109b7e0f4077f","be29bf5ae6f8b075ba2616b5a46b6b92c0fa717d","0d992f75fb04dd1734f67a8091e774c63913f706","60a9d5e86b3295db7d1fa291e1377a64cd507a95"]}
];

function importCafePosts() {
  const started = Date.now();
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    Logger.log('이미 다른 가져오기 작업이 실행 중입니다. 잠시 후 다시 시도하세요.');
    return;
  }
  try {
    removeCafeImportTriggers_();
    const sheet = getStorySheet_();
    const done = getCafeImportDone_();
    const folder = getOrCreateDriveFolder_(CAFE_IMPORT_FOLDER_NAME);
    let added = 0, skipped = 0, failedImages = 0;

    for (let i = 0; i < CAFE_IMPORT_POSTS.length; i++) {
      const post = CAFE_IMPORT_POSTS[i];
      const dateOnly = post.date.substring(0, 10);
      if (done[post.key]) { skipped++; continue; }

      if (Date.now() - started > CAFE_IMPORT_TIME_LIMIT_MS) {
        ScriptApp.newTrigger('importCafePosts').timeBased().after(60 * 1000).create();
        Logger.log('시간이 다 되어 여기서 멈춥니다. 1분 뒤 자동으로 이어서 실행됩니다. (이번에 ' + added + '개 추가)');
        invalidateCache_(CACHE_KEY_STORIES);
        return;
      }

      const imgTags = [];
      post.images.forEach(function (hash, n) {
        try {
          const res = UrlFetchApp.fetch(CAFE_IMAGE_URL_PREFIX + hash, { muteHttpExceptions: true });
          if (res.getResponseCode() !== 200) throw new Error('HTTP ' + res.getResponseCode());
          const fileName = 'cafe_' + post.key.replace('/', '_') + '_' + (n + 1) + '.jpg';
          const blob = res.getBlob().setName(fileName);
          const file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          imgTags.push('<img src="https://drive.google.com/thumbnail?id=' + file.getId() + '&amp;sz=w1200" class="content-resizable-img">');
        } catch (err) {
          failedImages++;
          Logger.log('사진 실패: ' + post.title + ' #' + (n + 1) + ' - ' + err);
        }
      });

      const createdAt = Utilities.parseDate(post.date, 'Asia/Seoul', 'yyyy-MM-dd HH:mm');
      const row = buildRowByHeaderNames_(sheet, STORY_HEADERS, {
        ID: Utilities.getUuid(),
        Category: CAFE_IMPORT_CATEGORY,
        Title: post.title,
        Content: imgTags.join(''),
        Date: dateOnly,
        ThumbnailURL: '',
        ThumbnailFileId: '',
        FileURL: '',
        FileName: '',
        Views: 0,
        AttachmentsJSON: '[]',
        CreatedAt: createdAt,
        PdfFileId: ''
      });
      sheet.appendRow(row);
      done[post.key] = true;
      saveCafeImportDone_(done);
      added++;
      Logger.log('추가: [' + post.board + '] ' + post.title + ' (' + dateOnly + ', 사진 ' + imgTags.length + '/' + post.images.length + ')');
    }

    invalidateCache_(CACHE_KEY_STORIES);
    Logger.log('완료! 이번에 ' + added + '개 추가, 이미 있던 글 ' + skipped + '개 건너뜀, 실패한 사진 ' + failedImages + '장');
  } finally {
    lock.releaseLock();
  }
}

/** 진행 상황 확인: 몇 개가 들어갔는지 실행 로그에 보여줍니다. */
function cafeImportStatus() {
  const done = getCafeImportDone_();
  const remaining = CAFE_IMPORT_POSTS.filter(function (p) { return !done[p.key]; });
  Logger.log('전체 ' + CAFE_IMPORT_POSTS.length + '개 중 ' + (CAFE_IMPORT_POSTS.length - remaining.length) + '개 완료, ' + remaining.length + '개 남음');
  remaining.slice(0, 10).forEach(function (p) { Logger.log('  남음: ' + p.date + ' ' + p.title); });
}

/** 자동 이어하기 예약을 멈추고 싶을 때 실행하세요. */
function stopCafeImport() {
  removeCafeImportTriggers_();
  Logger.log('자동 이어하기 예약을 지웠습니다.');
}

function removeCafeImportTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'importCafePosts') ScriptApp.deleteTrigger(t);
  });
}

const CAFE_IMPORT_PROP_KEY = 'CAFE_IMPORT_DONE_V1';

/** 이미 옮긴 카페 글 번호 목록 (스크립트 속성에 저장) */
function getCafeImportDone_() {
  const raw = PropertiesService.getScriptProperties().getProperty(CAFE_IMPORT_PROP_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveCafeImportDone_(done) {
  PropertiesService.getScriptProperties().setProperty(CAFE_IMPORT_PROP_KEY, JSON.stringify(done));
}
