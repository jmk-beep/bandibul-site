/**
 * ==========================================================================
 * 다음카페 → 홈페이지 「특별한날」 옮기기 (CafeImport.gs)
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

const CAFE_IMPORT_CATEGORY = '특별한날';
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

/**
 * 예전에 직접 올린 「소소한일상」 글 10개의 날짜를 다음카페(외부강사지원 게시판)에
 * 올렸던 원래 날짜로 고칩니다. 글 ID로 찾아 Date, CreatedAt 칸만 바꿉니다.
 */
function fixOldStoryDates() {
  const FIXES = {
    '26100641-9838-4163-ac59-b13c5bfeeede': '2023-10-16', // 23년 10월 레크레이션 활동
    'bac80751-48e3-4750-8928-36fff9678e23': '2023-11-02', // 23년 10월 푸드아트테라 활동
    'a840d601-23e9-4b5f-8207-0a8ba0e68e59': '2023-11-28', // 23년 11월 푸드아트테라피 활동
    '2d9b8ebf-ece7-44a1-813c-bdd5e1d08a40': '2023-12-18', // 23년 11월 레크레이션 활동
    'b9f748ea-bfbe-4878-91fa-8d107bfa1a65': '2023-12-25', // 23년 12월 레크레이션 활동
    '06e811f6-aad3-49cd-89c3-3ab8c7f29916': '2024-01-03', // 23년 12월 푸드아트테라피 활동
    'ff09ea2e-c89c-4377-9d31-f436ad77da55': '2024-01-22', // 24년 1월 레크레이션 활동
    '12020243-02b9-433c-9d60-249e213ba8a7': '2024-01-31', // 24년 1월 푸드아트테라피 활동
    '05f104c3-c06c-40ad-a66b-779f394e89c0': '2024-02-01', // 24년 1월 장애인체육회
    '33a48a03-395c-4df6-b35c-867487e6df2b': '2024-02-01'  // 24년 천안시장애인종합복지관 종이공예 활동
  };
  const sheet = getStorySheet_();
  const colMap = getHeaderIndexMap_(sheet);
  const values = sheet.getDataRange().getValues();
  let changed = 0;
  for (let i = 1; i < values.length; i++) {
    const id = values[i][colMap['ID']];
    const newDate = FIXES[id];
    if (!newDate) continue;
    sheet.getRange(i + 1, colMap['Date'] + 1).setValue(newDate);
    sheet.getRange(i + 1, colMap['CreatedAt'] + 1)
        .setValue(Utilities.parseDate(newDate + ' 12:00', 'Asia/Seoul', 'yyyy-MM-dd HH:mm'));
    Logger.log('날짜 변경: ' + values[i][colMap['Title']] + ' → ' + newDate);
    changed++;
  }
  invalidateCache_(CACHE_KEY_STORIES);
  Logger.log('완료: ' + changed + '개 글의 날짜를 고쳤습니다.');
}

/**
 * 카페에서 옮겨온 글(사진이 「반딧불_홈페이지_카페이전사진」 폴더에 있는 글)을
 * 모두 CAFE_IMPORT_CATEGORY(특별한날)로 옮깁니다. 직접 올린 글은 건드리지 않습니다.
 */
function moveCafePostsToCategory() {
  const fileIds = {};
  const files = getOrCreateDriveFolder_(CAFE_IMPORT_FOLDER_NAME).getFiles();
  while (files.hasNext()) fileIds[files.next().getId()] = true;

  const sheet = getStorySheet_();
  const colMap = getHeaderIndexMap_(sheet);
  const values = sheet.getDataRange().getValues();
  let moved = 0;
  for (let i = 1; i < values.length; i++) {
    const content = String(values[i][colMap['Content']] || '');
    const m = content.match(/thumbnail\?id=([a-zA-Z0-9_-]+)/);
    if (!m || !fileIds[m[1]]) continue;
    if (values[i][colMap['Category']] === CAFE_IMPORT_CATEGORY) continue;
    sheet.getRange(i + 1, colMap['Category'] + 1).setValue(CAFE_IMPORT_CATEGORY);
    moved++;
  }
  invalidateCache_(CACHE_KEY_STORIES);
  Logger.log('완료: ' + moved + '개 글을 「' + CAFE_IMPORT_CATEGORY + '」(으)로 옮겼습니다.');
}


// ===========================================================================
// 2차 이후: 본문 글 + 사진을 원래 순서대로 옮기는 묶음들
//  · 회의 묶음 → 「열린운영」 : 인권지킴이단회의 / 운영위원회 / 회의 (2023년 10월 이후 17개, 사진 33장)
//      실행: importCafeMeetingPosts   진행 확인: cafeMeetingImportStatus
//  · 교육 묶음 → 「배움」     : 교육 / 부모간담회(교육) / 직원(교육및연수) (2023년 10월 이후 25개, 사진 111장)
//      실행: importCafeEduPosts       진행 확인: cafeEduImportStatus
//  · 자원봉사 묶음 → 「나눔동행」 : 자원봉사자활동 사진 (2023년 10월 이후 5개, 사진 27장)
//      실행: importCafeVolunteerPosts 진행 확인: cafeVolunteerImportStatus
//  · 일상 묶음 → 「소소한일상」 : 외부강사지원 / 지역사회교류지원 / 이용인 자조모임 (2023년 10월 이후 108개, 사진 563장)
//      먼저 deleteOldDailyPosts 로 예전에 직접 올린 10개를 지운 뒤
//      실행: importCafeDailyPosts     진행 확인: cafeDailyImportStatus
//  각 묶음은 옮긴 글 번호를 따로 기록하므로 여러 번 실행해도 중복되지 않습니다.
// ===========================================================================

const CAFE_MEETING_POSTS = [
  {"key":"kVAF/19","board":"운영위원회","title":"2023년 3차 운영위원회의 개최복","date":"2023-11-13 12:05","blocks":["1. 일시: 2023.09.14(10:30~11:30)","","2. 장소: 반딧불단기보호센터(천안시 서북구 신당새터1길 72)","","3. 참석: 9명 중 5명 참석","","4. 안건","- 2023년 상반히 프로그램 결과 보고","- 2023년 하반기 프로그램 계획 보고","- 2023년 1월~8월 세입.세출 결산 보고","- 2023년 1월~8월 후원금 수입 및 지출 보고","- 2023년 2차 추가경정예산(안) 심의","- 시설 이전 건축지 현황 보고","- 기타안건","","img:dc12e8db831d1fbc19b9ebfe646edb62c62fa39b"]},
  {"key":"kVAH/14","board":"인권지킴이단회의","title":"2023년 반딧불단기보호센터 4분기 인권지킴이단회의 및 인권상황점검","date":"2023-12-12 21:41","blocks":["▣ 2023. 4분기 반딧불 인권지킴이단 회의 및 인권상황점검 진행","","1. 일 시 : 2023. 12. 07. (목). 10:30","2. 장 소 : 반딧불단기보호센터","3. 단 원 : - 외부단원 : 황관익(단장). 노규환위원. 김태욱위원.","- 내부단원 : 이순옥(간사). 이용인 위원","","img:9626d09a8c71379f34767ccb3226af83fd95bcce","img:bd84315824c4d649604d9ad80926c0c45bf19c48","img:e45cca4f466a3616d5918ae44dd192fedd898cd4","img:56fb252e8ef23fe339b576409dec8ad948f91778"]},
  {"key":"kVAH/15","board":"인권지킴이단회의","title":"2024년 인권 지킴이단 1분기 회의","date":"2024-03-20 14:12","blocks":["img:b6e6df922b3b76a82b2d5b965b3bc0ae7f0e37d7","img:8302dbdbf9c71519236cfa4dd16bc13ef27286eb","회의 중....입니다.","img:f2b5ed53a0f148a0799daac040c2c965139deea0","신규 단원이신 김준환 위원님 ( 반딧불단기보호센터가 현재 있는 곳에 이장님을 하고 계십니다.","img:ff7d5533b302d3c951e832d531c52717430c5e46","신규 인권지킴이단 단원 이신 송경호님.","24년 1/4분기 인권지킴이단 회의를 3월 14일 목요일에 진행 하였습니다. 간사님이신 이순옥 단원은 임기 만료 이시구요.","개인 사정도 있고 해서 새로운 분들이 위촉 되었습니다."]},
  {"key":"kVAF/20","board":"운영위원회","title":"2023년 4차 운영위원회의 개최","date":"2024-05-13 11:53","blocks":["1. 일시: 2023.12.06(10:30~11:30)","","2. 장소: 반딧불단기보호센터(천안시 서북구 직산읍 군서2길 49)","","3. 참석: 9명 중 9명 참석","","4. 안건","- 9월~12월 프로그램 실시 현황 보고","- 2023년 1월~11월 세입세출 정산 및 후원금 내역 보고","- 2023년 사업 자체평가 결과 보고","- 2023년 3차 추가경정예산(안) 심의","- 2024년 본예산(안) 심의","- 2024년 연간사업계획 보고","- 기타안건","img:673a9e7c38dba459fd9f32b3f8484eae6d3e2970"]},
  {"key":"kVAF/21","board":"운영위원회","title":"2024년 1차 운영위원회의 개최","date":"2024-05-13 14:45","blocks":["1. 일시: 2024.03.18(11:00~12:00)","","2. 장소: 반딧불단기보호센터(천안시 서북구 직산읍 군서2길 49)","","3. 참석: 9명 중 8명 참석","","4. 안건","- 소식지 제작 보고","- 2023년 사업결과 보고","- 2024년 주요사업계획 보고","- 2023년 세입세출 결산보고","- 2023년 후원금 수입지출 보고","- 운영규정 개정안 보고","img:4a7b7a41a5f1cb934de101648a182e8a732a5a42"]},
  {"key":"kVAF/22","board":"운영위원회","title":"2024년 2차 운영위원회의 개최","date":"2024-07-09 13:31","blocks":["1. 일시: 2024.06.27.(10:30~11:30)","","2. 장소: 반딧불단기보호센터(천안시 서북구 직산읍 군서2길 49)","","3. 참석: 9명 중 7명 참석","","4. 안건","- 2024년 상반기 프로그램 결과 보고","- 2024년 하반기 프로그램 계획 보고","- 2024년 1월~5월 세입,세출 결산보고","- 2024년 1월~5월 후원금 수입,지출 보고","- 2024년 1차 추가경정예산(안) 심의","- 기타 안건 보고","img:f606a3a20ce9d9540c8322dadf3dc01706501d90"]},
  {"key":"kJX5/36","board":"회의","title":"2024.03.11. 자체평가회의","date":"2024-07-09 13:37","blocks":["2025년도 장애인거주시설 평가에 대비하여 2023년 사업에 대한 자체평가 회의를 실시하였습니다.","","- 일 시: 2024.3.11.(9:30-11:00)","- 장 소: 반딧불단기보호센터 회의실","- 평가년도: 2023년도","- 평가내용: 시설 및 환경 / 재정 및 조직운영 / 프로그램 및 서비스 / 이용자의 권리 / 시설 운영 전반","img:dc8306f139721b73c00de9884f037ab88f150ff8"]},
  {"key":"kJX5/37","board":"회의","title":"2024.07.08. 2024년도 상반기 사업평가회의 실시","date":"2024-07-09 13:38","blocks":["- 일 시: 2024.07.08.(9:20-10:30)","- 장 소: 반딧불단기보호센터 회의실","- 평가년도: 2024년도 상반기","- 평가내용","img:e7fe86d896f8d4b9878d9fd4740b5a32078503cc",": 2024년도 상반기 사업계획 전반(예산,프로그램 등)"]},
  {"key":"kVAH/16","board":"인권지킴이단회의","title":"2분기 인권지킴이단 회의","date":"2024-07-10 14:20","blocks":["img:4bda2640427faabc1ff0c5520d54f719b1b94afa","img:d5a8ab50ef1f87002bce31bc8cf678dba489a590","6월 2/4분기 인권지킴이단 회의가 진행 되었습니다. 매달 두번씩 갈비탕을 후원해주시는 곽만근 갈비탕에서 6월 둘째주 오전에 진행 하였습니다.","6분의 지킴이 단원 모두 참석 하셔서 회의가 잘 진행 되었습니다.","매번 인권 점검을 진행 해 주시는 단장님... 새로운 시선에서 반딧불을 지켜주시는 노규환 교수님.. 감사 합니다.","이용인 보호자 이신 송경호 위원님과, 지역사회 주민이신 김준환 위원님도 감사합니다.","개인 일정이 있으신데도 반딧불 이용인들의 인권을 위해 항상 신경 써주시고 계십니다. 지나가다 방문도 해주시고, 매월 점검차 들러 주시기도 하셔서 반딧불 직원으로 행복합니다.","","직원들이 행복해야 반딧불 이용인 들도 행복 하다는 원장님의 말씀대로 이용인들이 편안하고 행복하게 지내 직원들도 편안하고 행복하게 지내는 듯 합니다. ( 직원들 모두 그렇게 생각하겠죠?)","","* 회의 안건은","1.이용인과 직원 인권교육 진행 상황","2.매월 정기 인권점검 상황","3. 기타 - 이용인 성교육 안건이 있었습니다. ( 성인권 교육이 진행 되었지만 ... 상황극등의 더 좋은교육(노규환 교수님 추천)이 있어으면 했는데.. 상황이 ( 협의중 일정이 맞지 않아)여의치 않아 올해는 진행 하기 어려워 졌습니다. 하지만 계속해서 반딧불 이용인들에게 적합한 교육을 찾을 예정 입니다... )"]},
  {"key":"kVAF/23","board":"운영위원회","title":"2024년 3차 운영위원회의 개최","date":"2024-09-19 12:05","blocks":["1. 일시: 2024.09.11.(10:30~11:30)","","2. 장소: 반딧불단기보호센터(천안시 서북구 직산읍 군서2길 49)","","3. 참석: 9명 중 7명 참석","","4. 안건","- 2024년 7월~8월 프로그램 결과 보고","- 2024년 9월~12월 프로그램 계획 보고","- 2024년 1월~8월 세입·세출 결산보고","- 2024년 1월~8월 후원금 수입 및 지출 보고","- 기타 안건 보고","","img:3381275cd1b422d49fa500acb2ed09df54493c3b"]},
  {"key":"kVAH/17","board":"인권지킴이단회의","title":"3분기 인권지킴이단 회의","date":"2024-11-12 17:10","blocks":["img:35b5b6099632c47b2df720863763ef334bb071ff","img:1fb0d6f67415a5a9db2add84b407fbac85adc3c2","- 인권지킴이단 3분기 회의 입니다.","- 9월 4일 두정동 모 음식점에서 진행 되었습니다. .. 외부 단원 2명과 내부 단원 2명으로 회의 진행 하였습니다. - 회의 내용 : 3분기 인권상황 점검 내용 중간 보고","인권 교육 상황 보고","인권점검과 점검 장소에 대해 논의 되었습니다.","* 내부 상황점검 이외에 외부로 가서 인권점검 하는 내용을 논의 하였습니다.","- 차를 마시거나 식사후에 상황점검을 하는 방법은 단원들 모두 반가워 하셔서 결정되었습니다."]},
  {"key":"kVAF/24","board":"운영위원회","title":"2024년 4차 운영위원회의 개최","date":"2024-12-24 16:49","blocks":["1. 일시: 2024.12.11.(10:30~11:30)","","2. 장소: 반딧불단기보호센터(천안시 서북구 직산읍 군서2길 49)","","3. 참석: 9명 중 6명 참석","","4. 안건","- 2024년 9월~11월 프로그램 결과 보고","- 2024년 1월~11월 세입·세출 정산 및 후원금 내역 보고","- 2024년 사업 자체평가 결과 보고","- 2024년 2차 추가경정예산(안) 심의","- 2025년 본예산(안) 심의","- 2025년 연간사업계획 보고","- 기타 안건 보고","img:f404dde2e9ab3003f790887ee380dfedf65b097a"]},
  {"key":"kVAF/25","board":"운영위원회","title":"2025년 1분기 운영위원회의 개최","date":"2025-03-18 10:53","blocks":["1. 일시: 2025.03.13.(10:30~11:30)","","2. 장소: 반딧불단기보호센터(천안시 서북구 직산읍 군서2길 49)","","3. 참석: 9명 중 8명 참석","","4. 안건","- 소식지 제작 보고","- 2024년 사업결과 보고","- 2025년 주요사업계획 보고","- 2024년 세입세출 결산보고","- 2024년 후원금 수입지출 보고","- 운영규정 개정안 보고"]},
  {"key":"kVAH/18","board":"인권지킴이단회의","title":"25년 반딧불인권지킴이단. 1분기 정기 회의","date":"2025-03-28 01:34","blocks":["img:f543343e9f3e6e84f54fb5820e0a695efcb59eae","img:6f86366294d94f626c910c81ec6459a14777508e","img:bba77e53422559220ea1b555d16c8346adcdff37","img:e9e9b22d5e25cb1107c939fd390388d763a306ea","","반딧불인권지킴이단 정기 회의가 3월 세번째 주에 실시하였습니다. 인권 침해 사항 없어 즐거운 분위기에서 실시되었습니다.","매달 인권점검이 이용인 직원모두 실시됩니다.","인권침해 없는 반딧불은 언제가 즐겁습니다."]},
  {"key":"kVAH/19","board":"인권지킴이단회의","title":"25년 2분기 인권지킴이단 회의","date":"2025-07-09 14:55","blocks":["반딧불 인권지킴이단 입니다.","2/4분기 인권지킴이단 회의를 6월 25일 수요일에 진행하였습니다.","반딧불단기보호센터 인권은 잘 지켜지고 있어 회의는 빠르게 진행 되었습니다.","img:6d77d8e8f92aa5e546285e2ef16c3b13e42f71ea","img:22a276e7c6d75359e22d47bef821e19363c8d691","img:aa69b7d2000302c445e3acfb93297be78530ca8a","img:a36bf0506770b0380958829ea0f27736247e504e","인권지킴이단 회의 전에 인권상황점검도 실시하였습니다."]},
  {"key":"kVAH/20","board":"인권지킴이단회의","title":"3분기 인권지킴이단 정기 회의","date":"2025-12-17 11:23","blocks":["img:31bc97537d30388c8eb7755b5002e6cd1f6eb39f","img:647eb503026af168bb12532a616c49dce7a4baeb","인권지킴이단 25년 3 분기 정기회의 진행 하였습니다. 너무 늦게 올렸네요.. 그래도 9월에 진행 하였습니다... ^^","","물론 인권점검은 매달 진행 되었구요."]},
  {"key":"kVAH/21","board":"인권지킴이단회의","title":"26년 1분기 인권지킴이단 정기 회의","date":"2026-03-25 14:10","blocks":["3월 인권지킴이단 정기 회의를 개최하고 위촉장을 전달 하였습니다.","1월, 2월 , 3월 종사자 , 이용인 인권점검도 실시하였습니다. ^^","img:275a4e5a2f8cfbac5b367dd83197a4ab1da166f5","2월 종사자 인권점검","img:724ac4164d8a0aff828d97905f564cf1e7d0e987","2월 이용인 인권점검","img:5c1eca8ad0bd1ef6841c15e0993d36e7da5d3509","26년 1분기 인권지킴이단 위촉장 수여"]}
];

const CAFE_EDU_POSTS = [
  {"key":"kJWw/55","board":"직원(교육및연수)","title":"반딧불종사자 인권교육","date":"2023-10-12 09:53","blocks":["인권강사 전용필(등대의집)종사자 인권교육 진행 사진입니다~~","10/11(13:00~17:00) 실시하였습니다.","img:345ead6b2cd0b48ccb6bb3c46218b2ce2536c584","","img:cfde146c02ec0d2ba43e60cd072718485caae994","img:e3a475da8121c5c8bd42c6e224cd2ab23f9d5168","img:9bc5f326646f17a27bb3cad7d259a35165aefb88","img:fb12fdd605fe30a087e1bc2a7194c589e88c0bfb"]},
  {"key":"kJWw/56","board":"직원(교육및연수)","title":"23년 반딧불 약물오남용 및 성인병교육실시","date":"2023-10-24 10:34","blocks":["반딧불단기보호센터 23년 10/18 이용인 종사자","약물 오남용 및 성인병 교육실시 결과입니다.","img:dace924b0df366a03d6e961317909529d5396cc7","img:35b3496d22dfa3b759accb9f96e135a6b004c5b0","img:2d4466819147ea527d62d737574e6a1a4a8813e3","img:d14f18f45f536c8f6e7ced4dddcc1f99f9e132e6"]},
  {"key":"kJWw/57","board":"직원(교육및연수)","title":"중대재해교육","date":"2023-11-23 14:31","blocks":["2023년 11.06(월요일) 한국기업교육원 주최 교육실시","종사자&이용인 교육받았음","img:d155a60058ab262703832bb5c16b32c9cf1b89cd","img:cb00db6dfc81bd3c5bff0c323c7bbe1fc1544861","img:5de46a0d7877ba8acf12d8ae4d8b35782a5cbbc3","img:c7d00089db86e3b96074e21fb46407baffdbb1db","img:c01ccca9c872009253f0c37554178f69886f31a7","img:e8bd148dfbef32946c640438a41e4b6e1a829f34"]},
  {"key":"kJWw/58","board":"직원(교육및연수)","title":"2023년 소방화재 모의훈련 실시","date":"2023-11-23 14:37","blocks":["반딧불 자체 소방훈련을 실시하였습니다.","종사자/이용인 전원이 실제 상황처럼 신속하게 훈련에 임하였습니다.","img:2c2b9a5f3d946ae04a6a3902a78b27abcd1f8615","img:0c5907e670728c043b5cc09791547b2ee33def27","img:911a69a2379764a95dc2b97d86c47eac7e9b7d87","img:7d706bcf60bda04e0222352cd883f4b924d1af0d","img:4c5f7eb15c5ce30cd7ee6bcd486e5923e4d78aa9","img:e6b19b38b28df531a9f87bd6f1cc6ee25552b407"]},
  {"key":"kJWx/90","board":"교육","title":"2024년 사회복지실습.","date":"2024-01-18 17:03","blocks":["2024년 제1차 사회복지실습을 시작하였습니다.","나사렛대학교 3학년 김 0 규 1/8~2/2 실시합니다~~","img:021c15652ccf0f062045eead63ed2a7e6f6d7b4c","img:7cd1210c275bacda3cff63a574271b8080cc2a0c","img:b8302c61f694b47def07ffff3739b37ee068fc4d","img:1acbcdfd329398dc33edae91d8e80501e3d190a9","img:e451910a866d722f3edfb71dd4420b872b957952"]},
  {"key":"kJWx/91","board":"교육","title":"2024 산업안전협회교육","date":"2024-02-26 09:32","blocks":["* 중대재해처벌법 교육실시~~","img:05fad0018f019905466bdc18b685bc3070ab8b4b","img:864b580091e1e8a998a1c4c342d9b46284dd10cd","img:a67872bfb54e74f42334b598103aa828a72031f7","img:0f3ed03a4bee21c4cbafeb6cf5362ba76e398973","2024.02.07","산업안전협회~~강사 (배경규)"]},
  {"key":"kJWx/92","board":"교육","title":"긴급복지신고의무자교육실시","date":"2024-02-26 09:40","blocks":["2024.02.19~~실시","강사:반딧불단기보호 김교 (원장님)","img:cb9a3c7d9f805bbf53ce7ffe6e6afb042e59e1cd","img:e9b5c6193366de232ed87288c9029b7f3098d244","img:baa3bd8557505516c574fa70f185f54e473f3038","img:d941597cfeaa7d116006ef0e1c1a01b0e6d83f03","img:f6eb11fad5053d83a61b7b22a83c39cb92816c1d"]},
  {"key":"kJWx/93","board":"교육","title":"개인정보보호/CPR 교육실시","date":"2024-02-26 09:51","blocks":["2024.02.21 실시-강사:박동","이에스한국법정진흥원주최","img:f30bb980e63715cf73cdc64d2a4d86ecfdbe72c0","img:7227da780f7a47ede20a7a0a5a632eb65c0e90ee","img:855d7f20dc304ce48247136c254f9d8ce2b49017","img:5f17e47d8a47d5091ac23a4ea761e2339f762032","img:4a4e714fc8dd64c59664820244dd630f0f843091"]},
  {"key":"kJWw/59","board":"직원(교육및연수)","title":"2024년 장애인식개선교육(종사자)","date":"2024-03-13 16:28","blocks":["충남지역장애인보건의료센터 주최로 교육을 실시 하였습니다","03/13 (수)요일 10:20~11:30","img:2b9032004cb92cfb0d3103e3620acdafbc61079a","img:b2bc2dc3bb87c37f82b00419ba07ef4fbfe1dd9d","img:9c3a30b8f683a54441b4523419aa36335dfac5d7","img:00f3a6a1d1355c5b5f65e0382a82c4eaf0d61dde"]},
  {"key":"kJWx/94","board":"교육","title":"2024년 사회복지실습.","date":"2024-08-06 18:23","blocks":["2024년사회복지실습2차 03/18~04/15","남서울대학교평생교육원~~김0숙실습종료하셨습니다.","img:407492577b0d061c243b93788d5f5a2411040ba8"]},
  {"key":"kJWx/95","board":"교육","title":"2024년 사회복지실습.","date":"2024-08-06 18:27","blocks":["2024 제3차 사회복지실습","위더스사이버 이 0 아 선생님 07/22~08/19 까지 합니다.","img:75497f164f52f0e8441803a3ef69452f599b4812","","img:740e6ba6fb542864b4a3e1e535fb737cbac1e47d"]},
  {"key":"kVAG/11","board":"부모간담회(교육)","title":"2024년 부모간담회 실시","date":"2024-10-04 13:10","blocks":["상반기 예정이었던 부모간담회를 하반기에 실시 하였습니다.","이용인 부모님 전원 참석은 못하였지만 참석하신 부모님들게서 적극적으로 회의에","참여해 주신덕분에 회의를 잘 마무리 하였습니다.","img:f78c8c360b4fc1efbc689394929f32bd577636f7","img:42cf43d7b8ca9797d2e901eb157ed3bee7efd30c","img:6a3900d38b8d0097848694d847c9122cc4461913","img:f956b48d16589c72ddd3cf2e24487860412a224c","img:e1620c32b42701e2f70e50e062b5b5018c6ceef9","img:f8c7f3e09a01d11c67f5f604952c383b1449365a"]},
  {"key":"kJWx/96","board":"교육","title":"24년도 마지막 소방 모의 훈련 ( 소방합동)","date":"2024-11-25 10:01","blocks":["img:04942c79f81f6298c73cb6f199fbc2e9de14551c","img:e685e41d6ac88d56f7648e492b881c1401133970","img:f97b0ee0df2465602849b4eaa4862a575a174cce","img:9df8cacdad9d832b976ea7e3bef656c9ec93ee6f","직산 안전센터 협조로 11월 22일 소방훈련 진행 하였습니다.","소방관 님들이 함께 해주셔서 정말 소방훈련 하는 것 같았습니다. .... 예정된 시간보다 늦게 시작 하긴 했지만 ( 고속도로에서 불이 나서 조금 늦게 함께 해주셨거든요.. ) 소방 진화 끝나고 함께 해주셔서 감사하고, 죄송한 마음이었습니다.","그래도 친절히 함께 해주셔서 감사합니다.","","내년에도 소방 합동훈련때는 신세를 좀 져야 겠네요.. ^6^","","올해 소방훈련은 모두 완료 되었습니다. 불이 나지 않게 조심조심... 화재로 소방관님들을 보는 일이 없는 한해가 되길 바랍니다.","훈련에 수고해주신 이용인, 선생님 , 소방관님 고생하셨습니다."]},
  {"key":"kVAG/12","board":"부모간담회(교육)","title":"25년 3/14일 반딧불부모교육실시","date":"2025-03-19 13:26","blocks":["25년 상반기 부모교육을 실시하였습니다.","8가정 부모님게서 참석을 하셔서 잘 진행하였습니다.","img:53a1b6fc95a31aac033d9b413e9bc216281777c1","img:ed23275733e6e4313127f6d0993c55844a73cc42","img:872546e0c49ec317d160d13c929762e208f89165"]},
  {"key":"kJWx/97","board":"교육","title":"25년1차 사회복지실습","date":"2025-03-19 13:37","blocks":["25년 사회복지실습을 시작~~","김0화선생님 3/10~4 / 4 올에듀 (평생교육원)","img:12204832e2f53790eee29ea840c3f35c21a32590","img:7e92e1b72d7d6182b83fd17d7486a697c3e742ef"]},
  {"key":"kJWx/98","board":"교육","title":"2025년 소방모의체험훈련","date":"2025-05-02 17:09","blocks":["2025년 4월24일 직산119안전 센터와 합동으로 실시한","자체소방 모의훈련 결입니다~~","img:3a01c1176764152d41bd94c72c45c9eef7a761ca","img:b3244523dd7cf3e35c72057a78bb842ba94c93a1","img:c51d1fbc81e1ee51a540b05c78aa5f04ce383656","img:dbeb2e75448fd297d7fe454762717b7c5d6e586b","img:9b39cdbdf12de46a9fab623a9d82868329871316","img:56b1e0d079556aa61c6756e80811c14ed1612a99","img:c6d4a3bb12b792d55568f16de68be7cd083cf0f1"]},
  {"key":"kJWx/99","board":"교육","title":"2025년 응급처치술체험","date":"2025-05-02 17:19","blocks":["2025년 05월01일 (충남안전체험관)","반딧불이용인/종사자 응급처치술체험","img:b3e7f5050c9286811ff345576d01829828ffb6ce","img:52ec4102079027e73247201664b4a40f83428fb3","img:c62edf2598cec79e98c1996c5f08f8e06ea89835","img:821dab5112b7677aaeb9c688c514df78c5071b18","img:8de8722729777df1bd92ce281ae9d78f30f58f59","img:e89cd9a46fa13cbab785c2daeaafaa3b1bd8cab3","img:d739ec1ccb29b423cda3d5b4627e145a634f12da"]},
  {"key":"kJWw/60","board":"직원(교육및연수)","title":"2025년 신입종사자교육","date":"2025-07-09 18:33","blocks":["2025년 7월1일 입사자 김 o 희T 김교식(원장님) 반딧불 운영에 대한교육","이선자(팀장) 생활재활 전반교육실시 하였음.","img:4d50eaba7cc5debc076417c26a52911e1a453b13","img:7d617c966ad608d77f15b655e9a008c34b51edae","img:a42e94f0cea23b8ef19b14e54486e2bd735020cc","img:9065b9e9eae443e8f79d4b893fba3e704ca3b995"]},
  {"key":"kJWx/100","board":"교육","title":"종사자 인권교육 ＜25년 8월 11일 ＞","date":"2025-08-20 13:40","blocks":["img:17d23725c263e51b30f5de1de3befe2b2d19107a","img:44e2f81e1d6646fbad0af0dce488bda93e999f18","25년 8월 11일 월요일 모든 종사자 인권교육 중입니다. 4시간 교육이라 힘드네요ㅜㅜ","","종사자의 인권, 장애인 당사자의 인권.. 인권교육은 매년 몇시간씩 해도 어려운 교육인것 같습니다. 직원모두 참석하여 인권교육 중이네요.. 방학이라 이용인들 모습도 잠깐씩 보이네요. ^6^","","강사님.. 교육들으랴 이용인들 돌보느라 정신이 없었습니다.. 모두들 고생하셨네요.. ^^"]},
  {"key":"kJWx/101","board":"교육","title":"소방훈련","date":"2025-08-20 13:46","blocks":["2025년 8월13일 직산119안전센터 합동훈련 상황","img:72a794a7085be46e4cee1404774512faf8e6bd7d","img:843e7a887bb648ca2edd31670fd1500fc08e6253","img:f970e57998ba4060a8246479fe5e07dba78c09cd","img:f0585632de98d06e70ac2ec79f1862b9baeb27c6","img:b40a25e7cbd9fe228a83f1ca44cb779b425eb959","img:69112b61c8012a3107314aa1f3ef31d8639267a6"]},
  {"key":"kJWx/102","board":"교육","title":"2025년도 약물 오,남용 교육","date":"2025-08-20 14:12","blocks":["일 시 : 2025.08.11.","대 상 : 이용인,종사자","img:a6cf0f521ddc4a27787827aee5a2b770a9510156","img:0e2e46e9deabb9769fe389195edb6c2b68253414","img:99a2a650f1c015bd2021f7217944501398e3468c","img:e0f76271d3294630591071b6a85c9cc4573a502d"]},
  {"key":"kVAG/13","board":"부모간담회(교육)","title":"2026년 반딧불단기보호센터","date":"2026-03-25 16:12","blocks":["부모간담회 실시 사진","img:14857f2353de09a3bcaf52fc1d285e19a8f4ee77","img:29a92fcc03ee15ef865d317fe19aad49e7a9a08e","img:342589e3c0bbd0ebf56f9c22536d32b124345c7b","img:a30e0180faa404698e41be127c63d6c89c681c38"]},
  {"key":"kJWx/103","board":"교육","title":"26년 6/18일 직산119센터 합동훈련","date":"2026-07-01 15:48","blocks":["직산119안전센터와 합동으로 심폐소생술과","소방모의 훈련을 실시 하였습니다.~~","img:ac71dd0c36ac02d658de1bd419e6cd5dd9393a9f","img:1f9710c49c5647e1e16ea957165bb19c22bafcfb","img:a7ea72dacd24c9e629c93bc6f0b4df51f3c2f85a","img:2d777827126c317ac848af656238aca29f735061","img:fde0c49bf7a7a76c3d9cece4ef5629c0ddb8d9c9"]},
  {"key":"kJWx/104","board":"교육","title":"성폭력예방교육","date":"2026-07-09 10:51","blocks":["7/8일 다함센터주관으로 진행되었습니다","img:f712419cd69851324d56b040e488468137306f33","img:d9d6438d2ddfefd2027baebc73d38ca3ea98dfd1","img:8924f70eb84fe7cc39f56191bfcf28c9bff812fa","img:1f74bf6fc802edfd70775742e5511dcbba5a8672"]},
  {"key":"kJWx/106","board":"교육","title":"응급처치교육과 안전교육을 받았습니다~~","date":"2026-08-03 15:03","blocks":["응급처치술을 실습하는 모습입니다~~","안전교육도 열심히 참여하여 모두가 적극적인 교육이 되었습니다~~","img:b4b75ba195b0bc7fec51c8405da5a9b390d17558","img:93191c1228bb4c32491fd848b3b0ffa421caa832","img:c27cda1758afa6e1e4387f705bc5551358a0c4a2","img:f7b01dffdc07ef75ad16d91d12b7eb1152f17d6d","img:487651ae2b2d9c1d446d6808bbad210e5d90acb5","img:22bf4f8a84f5758d2c1a6d99fe45359ee18059b9"]}
];

const CAFE_VOLUNTEER_POSTS = [
  {"key":"bDcZ/119","board":"자원봉사자활동 사진","title":"23년12월16일 산타잔치 참여","date":"2023-12-21 13:44","blocks":["* 개인 자원봉사/기타연주와 노래 재능기부","- 군서2리 김준환이장님, 강지숙 가수님","img:98eeef32c8f30a60d9b16668f21930e938572950","*. 정미현님, 정유진님","-. 따뜻한맘을가진사람들의모임 회원/ 장고치기 재능기부","img:b8c641ab46d46454b27a9f010c1bb6d3486338d8","","*. 천안에서기타를연주하는사람들의모임","-이종숙회장님외 회원님들","img:429a5f89f280a38940b26f4eca29043972688756"]},
  {"key":"bDcZ/120","board":"자원봉사자활동 사진","title":"24.01.17.그린하트봉사단 원예봉사","date":"2024-01-19 20:33","blocks":["*. 반딧불이용인들과 그린하트봉사단(자원봉자자)과 함께 예쁜화분에 \" 호주매화\"를 심으며","원예활동을 하며 즐겁고 뜻깊은 시간을 갖었습니다.","img:e0a22876ef48f90e3d60a57e81304fa884aeb8d2","img:7bfb14d6dbb27b3313995e72bf655cfa55a3b45a","img:a49f3fc51ea1c0e35e6b26aeeb44b0a736501d82","img:840a3741cf12dca27f5e758fcc6e8b9dcc31e431","img:05814f2ee1e65cee355472b009e9dcda733d0a6f"]},
  {"key":"bDcZ/121","board":"자원봉사자활동 사진","title":"24년 04월 27일 자원봉사자와 함께 나들이","date":"2024-05-07 11:32","blocks":["+. 따뜻함맘을가진사람들의모임(자원봉사자)와 함께 하는 나들이.","장소 : 서천 신성리갈대밭, 서천 국립생태원","","img:bf9161f02597cd893e91ac660275433cbf38e6d2","img:697545d725cb913c46f392137dc6a2a80a849205","img:f32e35ad71130e9d770729cabe462c7bc82363cc","img:3e0575f0f229c329ea1a58ab5a9756cc6afddb6c","img:09adec5c8f11e03fbd437e194eaf17953d2f07be","img:9b47f826a2dd711a4f991a359768978eb846e73a","img:a91415dc7d3e795f7e2af72c4851d3d62c65be21","img:d10d623e07dab624bfba219e42762fff5da6bee1"]},
  {"key":"bDcZ/122","board":"자원봉사자활동 사진","title":"24.10.05. 자원봉사자와 함께 역사 탐방 여행","date":"2024-10-18 10:43","blocks":["1. 장 소 : 청와대, 국민품으로 / 경복궁","2. 주최, 후원 : 한줄두줄나눔 봉사단, 천안남산로타리클럽","img:e27d0bad31664f8223abd85ad51ae1b1f68760b5","img:ec22b9d12605b270058e1868968f308832db2350","img:5b4f3306f17900f7a5274754d31d020953df799b","img:58e00e16ee1da9097e2c1ab2e9dddabd3cffa2cf","img:eae32a4659dc588fb021327ea37c15ccc44ff14b","img:9e74ce5f0453f89b877e7152dcbbed8e966ada3e","img:0aef4cec46763cffcce0150a48e16f8ac4ee3127"]},
  {"key":"bDcZ/123","board":"자원봉사자활동 사진","title":"2026년 한줄 주줄봉사단체 방문","date":"2026-08-11 09:14","blocks":["7/31일 한줄두줄 단체에서 더운날씨임에도 반딧불에","닭곰탕으로 점심식사를 제공해 주셨습니다~~","img:8096118ed1b5da046a49dc925d17357a8bf56cd4","img:f35c900346e9b8f6d1c7deb29041b1c20da8927a","img:515e1f6f003cdcdf31bb336011e1043599536597","img:829f19ccd80aa976f856a4ebb0fb345921200dae"]}
];

const CAFE_DAILY_POSTS = [
  {"key":"kF14/137","board":"외부강사지원","title":"23년. 9월 푸드아트테라피(요리) PG활동","date":"2023-10-04 10:31","blocks":["▣ 9월 푸드아트테라피(요리활동) PG 활동","☞ 매주 화요일 월4회 진행 , 월1회 까페에 사진 올려 드립니다","▣ 요리제목: \" 닭 채소 꼬치 \"","","img:e78e36960ca99ba5892e1f734ca6afe936b86098","img:7a76d9d16de8bd32ee8d48c557e38ce04eaf8c34","img:29657481baffe2c6da0043a7bc0d0a8603a373cb","img:12d6ebe5099f3a67bfaf8e10b33411eef4fcafbc","img:07289d3cf6d977dabf0b79ab72e84174f5b38509","img:2bf6597e60034cbdbcb43829325689113f727d98","img:3ea1d04b543dece08daedfc6a27ec6789078b313","img:44313c65156927dfe315d82a93457119f5e36cf4"]},
  {"key":"kF14/138","board":"외부강사지원","title":"23년 10월 레크리에이션 / 외부강사지원","date":"2023-10-16 21:20","blocks":["*. 강사님의 수업을 열심히 잘~ 참여하고 있습니다.~","img:86836c7d8ceb72237fcb9e8ca94fe97cbf9cf0a3","img:3cc0a96f086bde5227faaac07bba74f7e0dfcf0b","img:9c82cb83a58829a1b0b5adf03ac49305391710f9","img:923386428e5754ec325c632c1ebd518cd91af520"]},
  {"key":"kPRX/49","board":"지역사회교류지원","title":"23년 충남장애인거주시설 한마음대회 참여","date":"2023-10-30 11:48","blocks":["*. 일 자 : 23년 10월 26일(목)","*. 대 상 : 이용인/ 5명","종사자/ 5명","*. 장 소 : 충남정심원 운동장","*. 내 용 : 시설별 장기자랑, 체육대회, 점심식사등","img:c0ec823d2e85786700535aa465bd2919b5973944","img:9e461311965a4a34866383a5e26de66cd50c20bf","img:368b85b6eef8de8fbca120d90e44e8cbde40df3b","img:9d29b64e0d5cceb8adc6d2c1ab618ff482c4ce77"]},
  {"key":"kF14/140","board":"외부강사지원","title":"2023. 10월 푸드아트테라피(요리) PG활동","date":"2023-11-02 10:42","blocks":["▣ 10월 푸드아트테라피(요리활동) PG 활동","☞ 매주 화요일 월4회 진행 , 월1회 까페에 사진 올려 드립니다","▣ 요리제목: \" 버섯 샌드위치 \"","","img:69a31bb73bc53605a1fb9f04587b6be9f8fd4ac9","img:50fec01e6290200675718e857f01dfa7aecb54b8","img:060bf26bf39563351fa2abed6168586a86504636","img:339f69d86a8f61465799118100472c55073df176","img:6a03e03074c64e3b70eff5727a25ad8dfa115b28","img:03e6faa5eb83ee779f514f1a9faaf45ff2b8a282","img:076a6a3dc4c57bd243539a90aba100d618945500"]},
  {"key":"kV68/62","board":"이용인 자조모임","title":"9월 자조회의 안건 - 밤 따기 체험","date":"2023-11-23 13:58","blocks":["img:05ce431a9695e6e3644667d0deecf7d9ed4ecedd","img:b00aeaeba7a7816687770780f6b24e534abc4afd","img:7e4cb6b1cde9c1dca2d16185e7eb105244ecafbf","img:2c04f9c173bddfd449167dcf6ce860a27fc04497","img:67075feaeec904088136953da16a0eacf2875684","img:41fc7aa13cb9609b1e172c6d5fd0098e4d9be4ef","9월 안건은 밤따기 체험 이었습니다. 추석 연휴 전에 밤도 따고 구워도 먹고 즐거웠지만 날씨가 도와주지 않아 비도 맞고 했었네요..","그래도 밤도 구워 먹고 재미 있는 하루 중에 즐겁고 체험 하고 왔습니다."]},
  {"key":"kV68/63","board":"이용인 자조모임","title":"10월 자조 회의 안건 - 가을 나들이","date":"2023-11-23 14:08","blocks":["10월 안건은 가을 나들이 었습니다. 신당동에서의 마지막 회의 였답니다. 외부로 나갔으면 좋았겠지만 10월에는 반딧불단기보호센터 이전이 있었습니다. 이전 새로운 곳으로 와서 주변 나들이를 하였습니다.","","img:117646162c353784047a4517458022f7eb34dee4","img:c90debce6ddb709cb9b6067e2cad6d0878ad9249","img:9458e8521e4898acf85b8f964283bedd528989a6","img:eb56e666089c463355cf789aa2fec236df3f2694","img:b99eb63dc1cd689a778fa165205b8530dda93ce9","img:4fa6542b5fff61631d830729c9e382c008f8b9f9","사진이 많이 없네요ㅜㅜ 주변 산책도 하고 중식도 먹고 온 날이었습니다. 10월의 안건이 이렇게 간단하게 지나갔습니다."]},
  {"key":"kV68/64","board":"이용인 자조모임","title":"11월 자조회의 - 안건 ' 산책'","date":"2023-11-23 14:16","blocks":["img:c67617a1c0498db3284ca004b2f84bcb9b6e30c1","img:305959be58608647926ee732ec5db2b91eb9eae2","img:89be1b3f3bd3d0defbd4f5eabf6cb363751f842f","img:8bce860ec2e00ea7aee52e0f965917a436ed2f39","img:312190e7a5e55d3fc553bb7f0b11894231003a37","img:29c25932c997dc3d805d7d9ce5f0eb9090cb4aa3","img:d405b45d727b154bbf92b083f847f681d62da0f1","img:fd71ef7a3a041f32c4c46d029edb3748fa82958f","","img:c5473fdab1b6ed9e43838ff4c85d8f58e15b3abe","1 1월 자조 모임 안건은 주변 산책 입니다. 새로운 곳에서의 첫회의.... 티비를 이용하긴 했지만... 잘 나오지 않아 아쉽습니다..","","신당동에서 직산으로 이사도 왔고. 새로운 곳에 적응하려면 무엇이 있는지도 다녀야 하죠?","직산 현 관아 와 향교가 근처에 있어 산책하기도 좋고 차도 신당동에 비해서는 조금... 인것 같습니다. 그래도 조심조심...","","10월 초에 이사를 왔는데... 산책을 가지만 사진이 많이 없었나봐요.. 날씨 좋은날 이쁜곳에서 사진도 찍고 즐겁게 산책도 하고.. 좋습니다. 겨울에는 나름의 아름다움이 있고... 다시 봄이 오면 같은 곳이라도 느낌이 다를 것 같습니다.","","아직 완전하진 않지만 새로운 곳에서는 잘 적응하고 있습니다. 좋은 점도.. 아쉬운 점도 있지만... 조금씩 적응해 가면서 새로운 반딧불을 만들면 좋을 것 같습니다."]},
  {"key":"kF14/141","board":"외부강사지원","title":"2023. 11월 푸드아트테라피(요리) PG 활동","date":"2023-11-28 16:36","blocks":["▣ 11월 푸드아트테라피(요리활동) PG 활동","☞ 매주 화요일 월4회 진행 , 월1회 까페에 사진 올려 드립니다","▣ 요리제목: \" 바질 토마토 부르게스타 \"","","img:a57a8d486743fcf0c1418ef28af70e5c5ff30d1b","img:20923c9270f84c91d36943da54a6cfdeaa0b82d6","img:4b02e660e270597ee7d6426566fac8abf924dafb","img:b4824f2e6bf6d258d0e879c7ea5669a509f08ec8","img:cc623a0cfdce39f327e94c00638b784391614f35","img:03709638374420dc15a3f09ea58a59f1ee6daead","img:d42ca1c453c35926162d23690629949f98552d14"]},
  {"key":"kF14/142","board":"외부강사지원","title":"23년 11월 레크리에이션 / 외부강사지원","date":"2023-12-18 09:56","blocks":["img:5441b7368a909c4270f890935403bc99910f83d8","img:780d1c1d401eda8be6a65cd597188d1348f53907","img:2f4f323b157b840c90ebcbf536e6d6da22d3177b","img:784458b994df6f791250a53110e345675992297d"]},
  {"key":"kF14/143","board":"외부강사지원","title":"23년 12월 레크리에이션 / 외부강사지원","date":"2023-12-25 19:29","blocks":["img:f634e1a363cc3f29dc650b71ba882560d2f9b3ec","img:6c20ba38bf17a4ee4e444768cf9fd56d7d343dcb","img:ec60b36ff0ba01343b31b4afe13dd285c00a9103","img:5acdbf8ec7fa108e1e8513016deafdfb0efd49c5","img:935ef60f8de5815355f14c4c980cc2f0da6bf9eb","img:6574fc2d33978866423e61ccc3747fb83507fa35"]},
  {"key":"kV68/65","board":"이용인 자조모임","title":"2023년 마지막 자조회의 ( 산타 행사)","date":"2023-12-29 22:28","blocks":["2023년도 마지막 자조 회의 안건은 산타 행사 입니다.","","코로나 19로 작년에는 산타 행사가 없어서 아쉬웠답니다. 반딧불이 신당동에서 직산으로 이사도 했고... 장소도 넓어 져서 인지 이번 산타 행사는 무척 기대가 됩니다. 오랜만에 따뜻한 맘을 가진 사람들의 모임... (따사모) 에서도 함께 해주신다 하여 너무 좋았습니다.","img:be28b5501f949dcc31db4815ff879f46cad8289a","img:aa48e9b757f113fd864c2b1a6a6a6b9fc071d218","img:c15dde2b21dbac3d45e897518113cea4bc022383","img:0309eb3be6e97de31421cc004dc176380fe47a76","img:6105d340abde8af6cf1b263faf265f7b3fdf29b3","img:bd10c900c7e886cc6fe084b0073e9da87a17b90f","넓어진 반딧불 거실에서 공연도 보고.. 식사도 맛있게 하고... 마지막으로 사진도 찍었습니다. 사진에 담지 못한 재밌고.. 행복한 공연 2023년을 마지막으로 다시 생각이 납니다. 행복하고 즐거운 일만을 기억하는 23이 되었으면 합니다.","","2024년에도 재미있고 신나는 일들이 많았으면 합니다..","아프지 않고... 건강하게... 그리고 늘 행복하고 웃는 일만 있는 하루하루가 되었으면 좋겠습니다.","","반딧불을 생각하면 행복한 웃음이 미소가 지어 지길 바라며.. 늘 행복하세요"]},
  {"key":"kF14/144","board":"외부강사지원","title":"2023. 12월 푸드아트테라피(요리활동) PG 활동","date":"2024-01-03 17:11","blocks":["▣ 12월 푸드아트테라피(요리활동) PG 활동","☞ 매주 화요일 월4회 진행 , 월1회 까페에 사진 올려 드립니다","▣ 요리제목: \" 크리스마스 아이싱 꾸미기\"","img:f59f1cc34d84fce1779bf956afd3644c9d62942c","img:3e5540acc0d4523403fb14b5f2cb94205b362c4b","img:deb4e316648a8c1bc890b2b5f3c9024513d4cc11","img:987f6aa499dfcaa9bc3436dfb7d4f4ded3f166f3","img:69ac98fd5d004909304af9cc7779764e315f73e3","img:fe781848d175fdf446f6087c319b616a2f5075f5","img:331170d5b8a0f7b0ac701e32e69d7c34954cbbd2","img:f211d207f70ededf61d2ee6cfe96572acbcf7969"]},
  {"key":"kF14/145","board":"외부강사지원","title":"24년 01월 레크리에이션 / 외부강사지원","date":"2024-01-22 21:27","blocks":["img:d6ad03334374722442095b37c4761308379b7e72","img:997e0807908d3d9868c25a4f0ae9f4094c182aa0","img:c983e4bfa1e6dee411998a0c8b8ed43a7f221523","img:6b0ca80b4d7faa752303486d5a36f746da169abd"]},
  {"key":"kF14/146","board":"외부강사지원","title":"2024. 01월 푸드아트테라피(요리) PG 활동","date":"2024-01-31 18:05","blocks":["▣ 01월 푸드아트테라피(요리활동) PG 활동","☞ 매주 화요일 월5회 진행 , 월1회 까페에 사진 올려 드립니다","▣ 요리제목: \" 와플 만들기\"","img:da9f094b665dca0a46137b96019b37cfa72d6ca3","img:f9485cd6c50a687af794c6e269dd585b86e070f2","img:8595ee2bb4916f12e62440c23e4b8311e650dbf8","img:d21586f009266a000b37ea506ab7494c6acf41bf","img:5f446a7554dc2bb1d5d599a3b91f113abe7cf37c","img:10aabda4b7d729e15e1ec6bd4fdb756f0762b18c","img:3016ce0f18b29edb2519acb0cdc6402aa5c55bc6"]},
  {"key":"kF14/147","board":"외부강사지원","title":"장애인체육회(생활체육)","date":"2024-02-01 11:26","blocks":["1월 마지박 활동사진~~모두 즐거워 하며 잘 참여합니다~~^^","img:fdb092ef8dd58b10ed880c1bccc959b9fc1b80d9","img:2d8b60dc168894ba07000d0e9fadc8a7bed86112","img:a71fb420ba8d03d5a26fe7bd26c85a0b1a4c4a86","img:62f9dbfd8a320c3fbff5d96602b4d18f0e6d9b1f"]},
  {"key":"kF14/148","board":"외부강사지원","title":"천안시장애인종합복지관(종이공예활동)","date":"2024-02-01 11:44","blocks":["매주 화요일 천안시장애인종합복지관 프로그램 참여 활동 (10:00~11:30)","이용인 두분 지원합니다~~.","img:a088c91e1b0c879226df0d6288fe246dea3bcbed","img:2adf5ac6d997a8776c8e65c9cae6019f980b618e","img:2b8c408b77ea37295be8635ed0ae8c2c783fe16c","img:0e168812a760ccade228271f7e54a5fcb52be972"]},
  {"key":"kF14/149","board":"외부강사지원","title":"24년 02월 레크리에이션 / 외부강사지원","date":"2024-02-28 20:04","blocks":["img:2d75235a939a965227fe4e7c98ece843fa3344b9","img:ada798a54d98617fdd522b45f60c4480c1a68c59","img:c929c65d143896236dc9730a082ec90042f6158d","img:b3944b7fc5aeee6e84e3578b494c8373e170301e","img:011cca00f6789d8a27fa6fca22b15fea59fd0e74","img:3f93094523804e57558f00b9ab8ac3318043c533"]},
  {"key":"kF14/150","board":"외부강사지원","title":"2024년 02월 푸드아트테라피(요리)활동 PG","date":"2024-02-29 14:24","blocks":["▣ 02월 푸드아트테라피(요리활동) PG 활동","☞ 매주 화요일 월3회 진행 , 월1회 까페에 사진 올려 드립니다","▣ 요리제목: \" 궁중 떡볶이\"","","img:fe87e21b39ab780b373cb5ea5ab644211c40b112","img:98bc0e99c39d12b39e80c25b0bd0257c254f8c05","img:52827c0b01a7b223c211ef940022a0f514f05327","img:9e0c8a6c9c53636c6df759c459cda19635bcf173","img:d189ec617c14c37245e27af89645a0b4608cfbb6","img:c4c54e5c532dfdc2560ccb91c4748db460be719f","img:0c1bcb7572071d2c40f40e56d4a9cdf2d00b7297"]},
  {"key":"kF14/152","board":"외부강사지원","title":"장애인체육회(생활체육) 3/4일 생활체육 프로그램 활동사진","date":"2024-03-11 18:53","blocks":["img:ec5247225ae134ff5b285eb8895c9af73913cf8e","img:65735618e29c3fd11c2dc4e101b0f2e624b6a128","img:f91440dee682eac7c5e024d0970729e67dd497d6","img:9f11bcac6cd84364fce7114e55e8d3f73dbfe65f","img:a136ba94e09606ec6eca055c00f2ce30807ddd8a","이용인이 프로그램에 재미있게 참여를 합니다."]},
  {"key":"kF14/153","board":"외부강사지원","title":"천안시장애인종합복지관(종이공예활동)","date":"2024-03-12 10:50","blocks":["3/5일 힐링페이퍼 크레프트(종이공예활동) 활동사진입니다.열심히 집중하고 있네요~~^^","img:6ffaccad8344f53ad02b46eaefed909dd2f3229d","img:070409aabb5efc1917460e582015739b15159db2","img:9faa164e6c43e07a8124283bcd1e295a65c3cb70","img:1ad57015cd80dd3eaf3f4c123416924117ef3e8f"]},
  {"key":"kV68/66","board":"이용인 자조모임","title":"2024년 1월 자조 회의 (제철 음식 먹ㄱ)","date":"2024-03-20 14:18","blocks":["24년 1월 반딧불 '스마일 자조회의' 1월 4일 진행","안건 - 제철 음식 먹기","' 가리비, 새우' 먹기로 결정 됨.","방학이라 오전에 실시 하였습니다. 사진에 안보이는 분들은 자유롭게 참여 하고 계시죠... 자리에 앉아서 회의 진행 하기는 많이 어렵네요...","img:4acf12dea1b461560a8a905c555dfc1f5277424f","img:ec3e3e9aaa67319a8c9a0a616c9e4b3797001108","img:e0070fb13575facee2d04e0cf02f55a0b2dd4e72","img:a91aa29c10f3378c33d79ddb65a2f8ec4acf99e7","가리비, 새우","맛있는 가리비와 새우... 올해는 킹크랩이 너무 비싸서.. 못먹었어요.. ㅜ ㅜ 사진에는 없지만 1월에는 딸기도... 맛난 과일도 먹었답니다.","너무 늦게 자조 회의 올려서 죄송합니다. 진행되는 내용을 열심히 올려 보도록 하겠습니다."]},
  {"key":"kV68/67","board":"이용인 자조모임","title":"24년 2월 자조 회의 (산책하기)","date":"2024-03-20 14:22","blocks":["img:801061de74e41b0fdac7588bca55ed48c54c88a1","img:7740fc973ff2706c56ba1a9fde11448ba5404320","img:66a0f474a0c5da2d08818af7a63a889378be346e","img:f16cd7189432b62cba5bead1b42c039623cf8194","24년 2월 자조회의를 진행하였습니다. 겨울 방학이 지나고.... 학교 등교하던 기간이라... 오후에 진행 하였습니다.","2월 13일 ..."]},
  {"key":"kF14/154","board":"외부강사지원","title":"24년 03월 레크리에이션 / 외부강사지원","date":"2024-03-20 17:50","blocks":["img:ee29fa4a491d92ef70ab6a52bedeb6729ec2528e","img:7f5bff3fde189816b221ce2e5f55686bc5d449a3","img:acb6ce5a579ed5d7dccab47cd4aa1e71c2c9db4f","img:78d0b36e5f020e9c53c8363484bd7852afd8dffd","img:323e8d833634b9364e0c0baa5f4f55d5285099dd","img:d0c800e6fcae1285d4549fe9bc0662f0049189ce"]},
  {"key":"kF14/155","board":"외부강사지원","title":"2024년 3월 푸드아트테라피(요리)활동 PG","date":"2024-03-27 11:53","blocks":["▣ 03월 푸드아트테라피(요리활동) PG 활동","☞ 매주 화요일 월3회 진행 , 월1회 까페에 사진 올려 드립니다","▣ 요리제목: \" 고구마 카레 볼\"","","img:8111c7450b38d0392d0285ded0c7696ee59a0cc6","img:7579bd0ed96217d94e60631546dd206e61750422","img:f1570f28e9631eefae62eeb3daf08177489a10f6","img:1b7aa5ef5f272af114b16b434bd3fce542fecb46","img:a4c55b44b3f77206c97315841a8af8b034479249","img:989d578dc7d0f5ff91687822380157b6e6379ae1","600","","img:90d0d1f77187c4791ab9b23b11edb737ec47c882","","img:97075bebebdbabdc369eb9798bd6c90fa4c58fcf","삶은 고구마에 견과류, 건포도 넣어 섞기~~"]},
  {"key":"kF14/156","board":"외부강사지원","title":"4/9일 힐링페이퍼 크레프트(종이공예활동) 활동사진입니다.","date":"2024-04-11 16:50","blocks":["img:3db0b125a256e9bfbb70a01cd6f3ac291951beb2","img:2e1d33ccc0921ff40b8f51fec6a1fa765e7c084e","img:6ae1247b94ec2729682cd0d0f67d28fdb25b9a9b","img:9bd7870b776bd50bb45f27647cc7c10fcc605389"]},
  {"key":"kF14/157","board":"외부강사지원","title":"장애인체육회(생활체육) 4/1.8일 생활체육 프로그램 활동사진","date":"2024-04-11 16:52","blocks":["img:15c09d3928c3a94611ad0cb1e4da1ac2b0ba581c","img:c7be24692d04791b635a29e246658ac2dda499bf","img:666434b0b51a5d1ab73c5776da3e2f706f62baac","img:886b0fa137896dcc1e7048059f91d6fe2fcfd25a","img:38c2a4c564cb707f8be3ce2b0a57e701034f1437","img:19feebc6ccc3e938cd1c3ac23deeeb4f90e44387"]},
  {"key":"kF14/158","board":"외부강사지원","title":"24년 04월 레크리에이션 / 외부강사지원","date":"2024-04-22 11:22","blocks":["img:a1e96f5e516b8474adde9c88e6134d52a9deda32","img:91f2f2751c66a01fc9fd70f809985a6b84e6e2bc","img:c38cc87d53f19a3f4f8db4522eacb415b00253bd","img:9e6e5df63cc9735cb7ff95d9a89caa1083709b16","img:da3f822e30f58a9a293ec48fcf109c9c88fb12a9","img:ebb473e5f0ceff9271a82fc91f5539234395c414"]},
  {"key":"kPRX/50","board":"지역사회교류지원","title":"24년 05월 04일 24년 한마음가족운동회 참여","date":"2024-05-07 11:42","blocks":["+. 주관 : 천안시장애인가족지원센터","+. 장소 : 성환 북부스포츠센터","+. 내용 : 레크레이션, 미니운동회","","img:4c43bfd8e44a91bbfaa8dcfe2ea680f89da39da6","img:330cb2c78ee22cefdcac0f49db6377013e2cf618","img:731983fab1975e5274ec36efe211bfd888299ce2","img:d40f13ef16ebda2be7dd6debd2ab77ec145c6d44"]},
  {"key":"kF14/159","board":"외부강사지원","title":"2024년 4월 푸드아트테라피(요리)활동 PG","date":"2024-05-07 15:14","blocks":["▣ 4월 푸드아트테라피(요리활동) PG 활동","☞ 매주 화요일 월 5회 진행 , 월1회 카페에 사진 올려 드립니다.","▣ 요리제목: \"애플파이\"","","img:ce9152ecba4711882c4b12dae76d31d02bc61043","img:b4105763fce4cf65b9f75f89edcb96cfb8a116c9","img:657d94b38a2842002b3c1c18655cea18a0129d64","img:01fe83a63ce933d4b28b6a83027511eff8e06531","img:61a6667e64cc402b280b8abc2259eef7d9c433f6","img:856e388af9be0d513eae9c7fe339bfebef5411d9","img:88137bbfa8db2bca7a590a1b08e790275d35ee97","img:85c5a2635586b9d164105613854213bbb707ef8d","img:8049b8daae72b556dac5307398503352f6cd70a8","img:b9d99fe262ea6309fac401446c1c13882840a117","img:005c05d29eb6770394cbe12d8fac72f0c4653b5e","img:0cac0ce31787af74701a92d78eb8ffa27c86142d","img:00b383ca170a2c137e747c9d8ba680a12e65b811","img:aa27671c8c2b47186d77e8446cc37c4c0a116af7","img:d2e34d1197ea1f129aabace68cd280fdfae6f6cd","img:70a6348103b4b7b5f5129ab5395b2175f76ed2a4","잘게다져 만든 사과 잼을 만두피에 넣어 사과파이 완성~"]},
  {"key":"kF14/160","board":"외부강사지원","title":"장애인체육회(특수체육) 5월 활동사진","date":"2024-05-21 11:22","blocks":["img:60af33932eac317a6bb707aac289af0038fabaf5","img:452ac5fd08d106629575ed9f7631dbb705c484e7","img:77429dfccf1b14b7b7a57fb86cc2915f40fc1a5b","img:4ee1e1c7a5ee9727b307a226dff87e3045d46924","img:5952cb321cf6a22c04729009a53a6eb07cea5f99","img:d49defe124e856f0be9c5df1c998d38499e1859d"]},
  {"key":"kF14/161","board":"외부강사지원","title":"5월힐링페이퍼 크레프트(종이공예활동)","date":"2024-05-21 11:27","blocks":["img:a02dc0300604c64be3d0f4e5d7e207bb8e7b010d","img:5490a3f69bc5b7b36338a6f0c549fa7261beb2cf","img:301741182f73634281132cff623c2e679b12ad5e","img:b3e5e09a2341148bc426fb1710a48221449ddb12"]},
  {"key":"kF14/162","board":"외부강사지원","title":"다도스튜디오(특별한 사람들이 떠나는 예술여행)5/8활동사진","date":"2024-05-21 11:36","blocks":["img:cb4486e0609815d2a19a77042444c2c80e4816f7","img:bf84c4a606aede069785271257195292807f3054","img:a6cad4b679eaf9e3fd7f32a28f06868235b4a6e5","img:03c65d1cf4af6e13ee80e38d4b10b1636888fd0c","img:1b9617278551ef0da6835cb9457f16c98115c6bc"]},
  {"key":"kF14/163","board":"외부강사지원","title":"24년 05월 레크리에이션 / 외부강사지원","date":"2024-05-23 11:33","blocks":["img:affa4ace1e29bf3476c4397956f84ed62ac6f36c","img:eacd660fd898809490e7d6e4bb099ffd37868ecd","img:4aee6145bfec517b836f8918a23906bd72abb979","img:ebae5c2fdcf9bffba1b31e515c1dfb3e32ead639"]},
  {"key":"kF14/165","board":"외부강사지원","title":"2024년 5월 푸드아트테라피(요리)활동 PG","date":"2024-05-31 16:27","blocks":["▣ 5월 푸드아트테라피(요리활동) PG 활동","☞ 매주 화요일 월 4회 진행 , 월1회 카페에 사진 올려 드립니다.","▣ 요리제목: \"컵과일 샐러드\"바삭바삭한 컵과일 샐러드 완성~","img:931d5a8a99cc034e763cd02f6660596996b82c9b","img:fe3728ee315f4755993aa4fde8a549964ed885a1","img:f46ba81a03482ed7999787e7da985b460414eb0a","img:d3052841ffc0da0aa17c5264eec6404a13d47787","img:d68ea3f3961abbd0f74b8004c3d95b3a8be4db9f","img:081fc945c9f7562df5eb8235c5a619ee94935965","img:7a4f702b35423d88fe55e4da401c9116d9463996"]},
  {"key":"kF14/166","board":"외부강사지원","title":"24년 06월 레크리에이션 / 외부강사지원","date":"2024-06-27 11:28","blocks":["img:605b8d6390b26ab9cf66f247c874ae57f832f614","img:51b792bac625c6d321706541d2c27d951230bd1e","img:63287196d8d18e1558471f12d8649f198fb5bf71","img:8c5c0fcbbd6f9707c8a7afb2dd2c7dabe3e884aa"]},
  {"key":"kF14/167","board":"외부강사지원","title":"2024년 6월 푸드아트테라피(요리)활동 PG","date":"2024-07-02 09:57","blocks":["▣ 6월 푸드아트테라피(요리활동) PG 활동","☞ 매주 화요일 월 4회 진행 , 월1회 카페에 사진 올려 드립니다.","▣ 요리제목: \"가지표고버섯 탕수육\"","img:499e4c85a1019ddae9957278d9304a6e325d72c8","img:18bcbe9fc45d7f98b6030f2b66298e372504e9e3","img:c434f094bd09e8071e0e80da7ac64d67e3969f0f","img:67fee370e96586ef592401d43b7d79c1abb19ce6","img:9fe78d7416688943f8c4dfd8284cff4262ca3d69","img:386d3dd0e6522e496f86b3fa6f5da9f4dbf25b2d","img:e41c3bdd4a9557dd9cf6c39083a79b8974cc78f3"]},
  {"key":"kF14/168","board":"외부강사지원","title":"6월힐링페이퍼 크레프트(종이공예활동)","date":"2024-07-02 15:05","blocks":["img:98ba18ac375fe435f20841730f080cc937afc34f","img:dfa0a472f7394c7462dd0698eca7fbb8652efcad","img:e1d8c524e0d8d86478e86a9afaf222024df2370a","img:fdc6ec1b40bcef556c17e1ba7cc47008e7a86649","img:5308d89825d00e1a7952f927030ee44817dd20e9"]},
  {"key":"kF14/169","board":"외부강사지원","title":"장애인체육회(특수체육) 6월 활동사진","date":"2024-07-02 15:07","blocks":["img:b470830a51408709d6e58f6699a9bb89d7f6d30a","img:289cfc7b5d42510185f56f6bbe889aecb0b335e4","img:268f1b474fd16dc4c0251def4358073087a3282d","img:bfcd6f15398c750989e6a6e8bb052b3eb7819be2","img:69b24d21b65332ce984d44a88182854ab9a2990f"]},
  {"key":"kF14/170","board":"외부강사지원","title":"다도스튜디오(특별한 사람들이 떠나는 예술여행)7/3활동사진","date":"2024-07-10 11:47","blocks":["7/3일 마지막 프로그램을 진행하였습니다.","이용인분들이 흥미를 갖고 적극 참여를 해서 좋은 경험이 되었습니다~~","img:c411a3ceea578ea682db042c75a65aff81da49e4","img:e4b124810ec69af6d63f79a91c0127044f7b94cb","img:3a18d944ef49761acfa1209e80a88cbca85bf30b","img:0a22b5725febe635e271b6dfdab362985ce2aa10","img:2ca16189bb003528da005cbfda89810685fce92d","img:4bbf16faa8b6d3b4f3e53b3851f83b8537a65144","img:056366365e3a57047e23ef3d1e5bc107704a1780"]},
  {"key":"kF14/171","board":"외부강사지원","title":"24년 07월 레크리에이션 / 외부강사지원","date":"2024-07-24 13:39","blocks":["img:4023b4598ac52557589cfdda8077961279078a28","img:a9908068821fbff4c1accb4475bc1da8ea79c0f9","img:64caa156f43bab14b370694a3abbcdcd9a7d2cf9","img:0ddb7595187ad1d841b04d033991cfdfc0bee007"]},
  {"key":"kF14/172","board":"외부강사지원","title":"2024년 7월 푸드아트테라피(요리)활동 PG","date":"2024-08-06 15:13","blocks":["▣ 7월 푸드아트테라피(요리활동) PG 활동","☞ 매주 화요일 월 5회 진행 , 월1회 카페에 사진 올려 드립니다.","▣ 요리제목: \"수박샐러드\"","img:85505cb15edc8ec721f42a9789eb1d4dd2b38ce4","img:b2edaa8d74ad9bf998976d52b1eaaf29daa3a5a9","img:3dbebd3d7c9f63a59775bd0a077a9c99982bfd0b","img:77a55096540c4d910eff9b0aa1762ee20345435e","img:10e5b40e5f0fb75daedee0f9b802dc6c50ec2e1b","img:27cf4057cfb77f7b85c5ef569404adfd77d9977e"]},
  {"key":"kF14/173","board":"외부강사지원","title":"2024년 8월 푸드아트테라피(요리)활동 PG","date":"2024-08-27 16:13","blocks":["▣ 8월 푸드아트테라피(요리활동) PG 활동","☞ 매주 화요일 월 4회 진행 , 월1회 카페에 사진 올려 드립니다.","▣ 요리제목: \"고구마과자\"","img:d8f8953b564d6355e613b86209028bdf3f143491","img:bd463600dc3d37d37c6bcb313fb2746bace4959c","img:775de96daef7966193ff6f20eb8d60c885c7461c","img:6d9eb08df0efabb1a6b33608ef367cc217b261f4","img:61db5320903c060d872c3758b97fbe3bb7fccc1c","img:a46ff1378b62ae3a8091491ab793bde99c4a5829","img:91960f0ec38963b51071b4611cc82d62222e1cf0","img:95733b7e7fd0457755b92b8bc725d4bf66c414b8"]},
  {"key":"kF14/174","board":"외부강사지원","title":"24년 09월 레크리에이션 / 외부강사지원","date":"2024-09-28 10:06","blocks":["img:8f14d0a9851f7d9cfc0eec898cede7abdc2fd057","img:c98e6dc575f64ad3361b4e943022fd7c6512b916","img:c8551bd93260db299ff6dcd1b6c35dd17a8daaaf","img:6cc24d184b6b43eed6a672551d7f63398b58227c","img:809f09010cb75841381a78cebbeb636954066f39","img:282ca99ec240da97d66fec75ee5a31efd4714de7"]},
  {"key":"kF14/175","board":"외부강사지원","title":"2024년 9월 푸드아트테라피(요리)활동 PG","date":"2024-09-30 12:02","blocks":["▣ 9월 푸드아트테라피(요리활동) PG 활동","☞ 매주 화요일 월 3회 진행 , 월1회 카페에 사진 올려 드립니다.","▣ 요리제목: \"사과 튀김\"","img:8003f262b6ffc987d716a4a97aab85e122a694fe","img:f4780ce753b3fbc9b5565367cdebdb5c9791d7fd","img:1452ec76608cf2fe59348447247af423cd1ecece","img:f045199a66691cc14ff436e27b6e23dce8e44995","img:00050fc524078756b63b2b53945fef77e5d97dba","img:39a8ebe94c2a9ee305185b9db6eca559b0a564e3","img:6ce5359bc74b20a0fa32c6aea3cb77a11128ecd6"]},
  {"key":"kF14/176","board":"외부강사지원","title":"장애인체육회(뉴스포츠) 하반기 프로그램진행 9월 활동사진","date":"2024-10-04 13:13","blocks":["img:0476a6d347013b257acbadde83c6e1ea8cb5185f","img:7722643b399881fcd9549891698dc04be747d473","img:325b32bc7c9197ceb9643f464493d5a874ee7ebb","img:7b50c08d3d2c4ac22cc5b7be7421d020d66f886d"]},
  {"key":"kF14/177","board":"외부강사지원","title":"24년 10월 레크리에이션 / 외부강사지원","date":"2024-10-18 10:35","blocks":["img:156ff07f8a26d8f71e6a9afc6859ecafde159647","img:52ba85d0a0258802367d599e35f3089c379c20e1","img:835f1bb5a4f4c55daea74174bbfbccb489874a83","img:7933eb3d31401d3f3dfa3b79f98428198e0b84a8"]},
  {"key":"kF14/178","board":"외부강사지원","title":"2024년 10월 푸드아트테라피(요리)활동 PG","date":"2024-11-05 16:26","blocks":["▣ 10월 푸드아트테라피(요리활동) PG 활동","☞ 매주 화요일 월 4회 진행 , 월1회 카페에 사진 올려 드립니다.","▣ 요리제목: \"맛살꽃게전\"","img:adb153b75a8e1e1026849be0c2ca8dd5eaac1d25","img:e9e01fbb3a1eafe4bcb500a27ca7bc643383b7c6","img:2b12d3f0f7baa375151e04ad377977ea0e8f0c95","img:9a73ba62502d0aff07787f19dbfe57278624bc18","img:e436d0009434b034c024d3115d9d6688fa0689c4","img:7b6a39a8d3a18cc1c3b20c17a98cefa4110c7deb","img:f86b3ecc6e8a9255e04f1535f3e64e640e5a3252","img:d180d7e297a5ad31551c63c6833958d7f8583bbf"]},
  {"key":"kF14/179","board":"외부강사지원","title":"장애인체육회(뉴스포츠) 하반기 프로그램진행 10월 활동사진","date":"2024-11-07 14:01","blocks":["img:d7859fcaa1465a18a2b4c2ec50f7f157756a428a","img:7076df484780bdfb95e8e16034196cd627c61f8f","img:0ab62ae4a323deaf6648d1edc73371e345ae0e99","img:30b949dae5c8ff68f184b99a6a538d5b6a541c42","img:4c781b1a9d7da2630d34c4f02b4db7781db5208c"]},
  {"key":"kV68/68","board":"이용인 자조모임","title":"24년 3월 자조 모임 (꽃구경)","date":"2024-11-12 17:29","blocks":["img:6935cad900d6e43efc3ba69632d958ebb58b2dce","img:1c536f6abdc0f8cf3eeef292850d9e60426d89ca","- 동네 산책을 하며 벗꽃 구경을 하였습니다."]},
  {"key":"kV68/69","board":"이용인 자조모임","title":"24년 4월 자조모임 (나들이)","date":"2024-11-12 17:34","blocks":["img:c08ad2ae2f72b00eb77ec5f103dacb41e2a646f2","img:d5e21ef52e58b421bb66a6c2db65aec533ff002a","img:eaaa3617c7f658ecf34641175e963bd157b06459","img:2aa890add425158fa9ba7c1733cd1920121a6741","-4월엔 즐거운 여행이 있었네요.. 신성리 갈대밭도 가고.. 서천 국립생태원도 다녀왔습니다."]},
  {"key":"kV68/70","board":"이용인 자조모임","title":"24년 5월 자조모임(성리순례 & 아그로 랜드)","date":"2024-11-12 17:39","blocks":["img:32d5b251f518b52378e83f820aa661633596f699","img:0780c4b3abd57ae1f185c3b6ae1cc54a6647d571","img:2d237db603b7d4b4fd0f36400fe943f7d5d0768e","img:7372c04332384ad89aec3c0e59abf79ff0db055e","-5월은 당진 신리성지 다녀왔습니다. 돌아오는 길에는 아그로 랜드도 다녀왔어요.. ^6^"]},
  {"key":"kV68/71","board":"이용인 자조모임","title":"24년 6월 자조모임( 충북 아쿠아 리움)","date":"2024-11-12 17:43","blocks":["img:3b6f2626e71d28d6b6e64b5e6273dcbd1e1fc757","img:5ad8b6826c92eef5f5c99ffa357a046d4313b7c4","- 충북 괴산에 있는 실내 물고기 박물관을 다녀왔습니다.","-날씨는 더워지만 항상 외출은 즐겁습니다."]},
  {"key":"kV68/72","board":"이용인 자조모임","title":"24년 7월 자조모임 (여름 캠프)","date":"2024-11-12 17:47","blocks":["img:6205b29757f1b19fce3d7d14f09609700cbdb145","img:8b0773c175829009f9daf0d092d4613dcd5f2b39","img:0f729f0194e21f6627aa72acb377fad5ffe4ba74","img:1d947238b5a7f8cabff2f9eac0ce63a449fe9e0e","-7월은 여름 캠프를 다녀왔습니다. 이용인 생일도 있어서 함께 생일 파티도 했습니다. 7월은 생일자가 많아서 생일 파티 후 모두 즐겁게 지냈습니다.","돌아 오는 길에는 보석박물관도 들렀습니다. ^^"]},
  {"key":"kV68/73","board":"이용인 자조모임","title":"24년 8월 자조모임( 물놀이 )","date":"2024-11-12 17:48","blocks":["img:e44b9e67ef6849dfad71662d31e00a2ec2183218","img:b2a635cd41b9ab0e007446b2d1791b4542c1f3af","img:5e8f088a44d7bac7b7af827e94903b3f3b1c3773","img:0c2dada9c512b7a5526be9de5d5337f5dcfa8b39"]},
  {"key":"kV68/74","board":"이용인 자조모임","title":"9월 자조 회의 ( 모임) 결과 - 송편빚기, 밤체험","date":"2024-11-25 10:10","blocks":["img:e8da4bb7cb94820eb8a8198b5a08fe71926c9c92","img:033d541ba993cef713b1dd29e013b8fb56f56a1b","img:787452174be2ce217ec24159cf1aa398d5ac64e1","img:b910a8aac39012380d8e8b603958f1627108872e"]},
  {"key":"kV68/75","board":"이용인 자조모임","title":"10월 자조모임( 산책)","date":"2024-11-25 10:28","blocks":["10월 자조 회의는 산책 하기 였습니다. 가을이라 산책하기도 좋고, 오전은 선선해서 동네 산책하기가 좋았습니다.","매일 나가는 산책이라 사진이 없었네요... 올해 가을은 단풍이 늦게 들었네요.. 첨부한 사진은 독립기념관 행사 갔을때 찍은 사진입니다.","img:e597f56e0a7f0ae4b88d30834ee2c63bf01093eb","img:a852c3bcbdf9b7aa79c4ce7f62033f6cc4f739a2","img:728568a3dde12b61e7fe2194d3f4e0a1e26e20fa"]},
  {"key":"kV68/76","board":"이용인 자조모임","title":"11월 자조모임- 단풍 구경","date":"2024-11-25 10:35","blocks":["올해 가을은 너무 늦죠? 단풍도 늦고, 은행나무길도 너무 늦게 물들었네요.. 조금 추운듯 했지만.. 그래도 은행나무잎이 바닥에 깔려 너무 이쁘네요..","img:280456995effa0cda80241f9608eb55cfbc00379","img:bae52637c0402b9705f9b64c0697f519a53bb341","img:b998ff7881d867c84f212bb37163c1b37f4ff0a9","img:f9a9a7c557d3cac34e1c09aeb9eb31033b861363","img:310070d7a80147a09b9719559e54d72a15e1b3df","img:26074b6f3691c09ff71c028d3b0ec9f55af0f6f5"]},
  {"key":"kF14/180","board":"외부강사지원","title":"24년 11월 레크리에이션 / 외부강사지원","date":"2024-11-29 11:02","blocks":["img:cf21ed85e758bc56f0dd2efc3c7e5fc79b5ec8d7","img:4071ce6b9772dfd3209301b4d669c5709dad3b25","img:91009973d6bfe7fbb96554d5fe71341a7081c190","img:aa92aaf589e0d1e9d39d655243454badcce6ec91","img:88be9565c15d3aa7a85943b09ea69ff3149f23b2","img:95870ecdf2b5e77512b1dac3725361fe7492b854"]},
  {"key":"kF14/181","board":"외부강사지원","title":"2024년 11월 푸드아트테라피(요리)활동 PG","date":"2024-12-10 16:29","blocks":["▣ 11월 푸드아트테라피(요리활동) PG 활동","☞ 매주 화요일 월 4회 진행 , 월1회 카페에 사진 올려 드립니다.","▣ 요리제목: \"양파링 전\"","img:41a357f9f1d7262c3dd2403fa9fe1fcefa4683e7","img:6ee751df806d3c6a75facd9d0d2e6724e13e714e","img:f2b3d9688140a77b505600b1dbd2f25928d7a2a3","img:1de41f0179cdd00b07f7fc49b46b4ae54005333b"]},
  {"key":"kF14/182","board":"외부강사지원","title":"장애인체육회(뉴스포츠) 하반기 프로그램진행( 24년 마지막활동)","date":"2024-12-13 14:54","blocks":["img:faa95a94cfdfd1c66a596511757a7324593d67e0","img:4059ba8dc1aac294f842134b4ce91287377af078","img:1a12bb7c5b4bf22c7a2448d2c6975a98586471e6","img:cc528c0c3f717c74c0aa754d3a66a93c5fb40e66","img:01d24c653c31c80653b4fa9e78568d1fdc464618","img:787ddf47ad24a6cf5c4dce1640c382130842ea32"]},
  {"key":"kF14/183","board":"외부강사지원","title":"24년 12월 레크리에이션 / 외부강사지원","date":"2024-12-24 22:51","blocks":["img:533800b0e48e1fa7cf2fab24e09c1f887faaee7f","img:443a3f1e21a57c5ba3246e4d18ff1318bf85aed1","img:219b4ab4c5077cd2d1029b5b1fbfbee83550e081","img:44e41c926b1a94f5327e1819fd059da6531b8485","img:7c26c62763dcd4e385694cee6792e490c197bf97","img:dfddd636131f93bf0670e019d89f7271cc4358da"]},
  {"key":"kF14/184","board":"외부강사지원","title":"2024년 12월 푸드아트테라피(요리)활동 PG","date":"2024-12-31 15:51","blocks":["▣ 12월 푸드아트테라피(요리활동) PG 활동","☞ 매주 화요일 월 5회 진행 , 월1회 카페에 사진 올려 드립니다.","▣ 요리제목: \"시금치 카나페\"","img:980f0c06fdefddbe66a22bd4d2e9b0a24b848ed6","img:32f595df4125dc8e42d52e36a26d8312e5875272","img:45acd9520560f64a3ed779a16f565a06f5354e6d","img:b55743c56f1d43136f580effea422dcda2b1474e"]},
  {"key":"kF14/185","board":"외부강사지원","title":"25년 01월 레크리에이션 / 외부강사지원","date":"2025-01-24 11:40","blocks":["img:293c4d801c6eb17545278908a2b15734f844f136","img:b92314879d0a05fc5dfb7c56eaaab48a01dc1421","img:20750dfb03c55fa2e75ffa06e2ddc756aa146e67","img:30b741e532ab74b6ae3044cf74459006ade30719","img:4bf7759b8b834a696738cebe42e389c15648f3dc","img:5b0d945a8268df01f0bf23073187b71580943642"]},
  {"key":"kF14/186","board":"외부강사지원","title":"1월 장애인체육회(뉴스포츠) 프로그램진행","date":"2025-02-03 18:59","blocks":["25년 1월 뉴-스포츠 활동사진 ~~설 명절전 윷놀이 체험","img:3842f6c4ce23b22961ebf1b3b3684e472922462b","img:353c55490296ecedc1bd59bab9a8809c829a44db","img:cce96e08402483fda8fdf7c7fbfe6b113d5a2635","img:dfeb86f8cfae53d40e32f0ef142cb2de9dbcf79c","img:22adde10ec13a1c5848f53c9441d2569dbf4c335"]},
  {"key":"kF14/187","board":"외부강사지원","title":"2025년 1월 푸드아트테라피(요리)활동","date":"2025-02-06 12:59","blocks":["▣ 1월 푸드아트테라피(요리활동)","☞ 매주 화요일 월 3회 진행 , 월1회 카페에 사진 올려 드립니다.","▣ 요리제목: \"애호박치즈그라탕\"","img:c7e05cb6e713619e746f4ca5fb5ea5b4ffac90f5","img:29cc84146e8fcae64539e2aa935fc4c4131558e6","img:b8a0398aecd3b46c1b0823a5256938eb2cf74446","img:ef33c1b41150a1e132839fb1453675bbedb54249"]},
  {"key":"kF14/188","board":"외부강사지원","title":"25년 02월 레크리에이션 / 외부강사지원","date":"2025-02-27 19:33","blocks":["img:36da742beeab88bfbe4df7125f8898bfb39e8bf9","img:0a3de939165dbe06c06598f1c34defcd52417de1","img:406b850e1a2727b20ed78d06df77bc9e7e76b5b3","img:f8e0bb1a40677dedb445d04af490d1363c3c498d","img:89e7c5f7dd8fadffe7c9eda93346607115abe734","img:ef40ece5efebe232ae05d526aaa486e654e18da4"]},
  {"key":"kPRX/51","board":"지역사회교류지원","title":"25년2월 장애인종합사회복지관 (날아라 음악교실)","date":"2025-02-28 10:36","blocks":["주2회 음악교실 참여","img:54bd1849f620b8a0b0a7ebd82e028e5875a5445f","img:d52e1198fa1b8d9835758a9e55f2d9faa8b535a2"]},
  {"key":"kF14/189","board":"외부강사지원","title":"2월 장애인체육회(뉴스포츠) 프로그램진행","date":"2025-02-28 10:38","blocks":["이용인 프로그램 참여 활동","img:f19949e2879b39874966b125b82a6ecff49ba75d","img:29bbb9a6aa1cc4b54a5b2f00bbaba50200834149","img:71cffdb3e57a0b1d3feb642b2211adb918883dff","img:af530504da23eae7f3e32d7aa3b4b3cd7057603f","img:007f71d0ffb89443f04e95bfee364a6216d6fc96","img:05469df16c7e099f7392ba9d3be97e080c6e8c40"]},
  {"key":"kF14/190","board":"외부강사지원","title":"2025년 2월 푸드아트테라피(요리)활동","date":"2025-03-18 11:02","blocks":["▣ 2월 푸드아트테라피(요리활동)","☞ 매주 화요일 월 4회 진행 , 월1회 카페에 사진 올려 드립니다.","▣ 요리제목: \"크림새우\"","img:0eb0d5bd882ede1547192a622c9d55c0ebe7b2e5","img:54c651ef9503fefb7cc697747fd1617a306f78ed","img:1e62bf44f65e1201741573771e1417c83f7f5356","img:5c80b48db7af014496938ea3c44308b3f2b55911"]},
  {"key":"kF14/191","board":"외부강사지원","title":"2025년 3월 푸드아트테라피(요리)활동","date":"2025-03-27 16:22","blocks":["▣ 3월 푸드아트테라피(요리활동)","☞ 매주 목요일 월 4회 진행 , 월1회 카페에 사진 올려 드립니다.","▣ 요리제목: \"시금치 프리타타\"","img:1034b0adf87fb2ea94d49b7933e5a687dddb8646","img:55fdcf91836a08aa926d78dbe320174c0f602584","img:c618bd8c9339a78b806db8f795b2d7fbeaa0f72f","img:85e204e4151d205be3f96f0bae17342cb23d39b1"]},
  {"key":"kV68/77","board":"이용인 자조모임","title":"2025년 3월 자조 회의 ＜ 안건: 산책 ＞","date":"2025-03-28 01:17","blocks":["img:4cfbf2b53b6614156215c9f423810343d7a114d2","img:318ae576fd8def737370ec2a220eeb3ed7ddfeec","img:c0ebe7e4d402d9ee8fc90eff448381500dd23d21","img:4dcb1d2e6d58fb7f4162b8f69513f52f813bea00","3월은 자조회의 안건으로 산책이 건의 되었네요. 날씨도 따뜻해지고... 가끔 바람이 불지만 가까운 동네 산책, 천호지 산책등 주중엔 날씨 좋은날 오전에, 귀가 하지전에 토요일에도 산책 중입니다."]},
  {"key":"kV68/78","board":"이용인 자조모임","title":"25년 1월 자조회의＜ 안건 : 만두 만들기＞","date":"2025-03-28 01:26","blocks":["img:d6dcf8d546bcf366c673e928276cc4cc99fa9496","img:4091242bc8367376c441304e18572669a9bd66d7","img:0ffb73da3edcefadd018f0d8ad938d47137101c6","img:801ff8478c7a6015299c389b52e68be43453c082","1월은 만두 만들기 입니다. 만두 잘 만들지는 못하지만 만들면서 ...사진엔 없지만 먹으면서 많이 좋아합니다.","매년 명절때 마다 만두 만들기가 즐겁습니다."]},
  {"key":"kV68/79","board":"이용인 자조모임","title":"25년 2월 자조회의 ＜ 안건 : 겨울 캠프＞","date":"2025-03-28 01:30","blocks":["img:fa010afa0cb3ceafb0efe2065c40121583bfe148","img:0677a35e4fb0c9e4517d8ddf776857aaf02d2e42","img:390ca87959a077716942e7e07e58d41cf8406777","img:a428fa15fb3c5fe1fb78ba810a761b37080990c0","2월 자조회의는 새로운 자조회 회장이 임명 되었습니다.","자조회의 안건은 캠프 였습니다. 겨울이 가기전 방학동안에 겨울 캠프를 가는 것이었는데... 눈이 아직 남아 있어서 눈썰매도 타고, 군밤에 마시멜로도 구워 먹고, 빙어 잡기 체험도 하였습니다. 사진엔 없지만 영화 촬영장에 가서 구경도 하고 맛있는 것도 먹는 즐거운 캠프가 되었답니다."]},
  {"key":"kF14/192","board":"외부강사지원","title":"25년 03월 레크리에이션 / 외부강사지원","date":"2025-03-28 17:46","blocks":["img:80e73f785f5027e1de71085e894aa7905c9f7b4d","img:b3cd0f4fcaf9097548249eec771b572fff881039","img:1ec80e7460946574197272acdcb41bbd13c20520","img:454d84568d414268c379d8b7f09fb4ca3cc0435b","img:38b10d22ee7fc9f3f12fe7c1dd992aa1774942d0","img:5d79514ecf37ec131720597986250060df21e80f","img:894b00db6669bab783d7127bf44db99d93dde062","img:26b893e696807c5cededa4f53382590c1b3247e7"]},
  {"key":"kF14/193","board":"외부강사지원","title":"3월 장애인체육회(뉴스포츠) 프로그램진행","date":"2025-04-01 18:51","blocks":["3월 뉴 스포츠 프로그램진행","img:ef371c98b457db0f2030cbb97a1349c7879fb685","img:10add0bd4aebf4e9f87e08b46dbc121612361ce1","img:79e60724f8a98714121bf5dc9c18a02e3171ad01","img:51520fd090939d3c51b4ce63a58385015a1b1e2b","img:1c7362bd362050e335fb95e4415d7acf74c05742","img:bd3bb154cc5898d9aa8ba70719a1b748a308f558"]},
  {"key":"kPRX/52","board":"지역사회교류지원","title":"3월 장애인종합사회복지관 (날아라 음악교실)","date":"2025-04-01 18:56","blocks":["img:c19135952da0591f2dc1a6f7f563bb49c4dfc6fc","img:efede5ef84baf9a2fac09d84dcb0a85ca70f833a","img:580e0a8aa8ccef23b2d0a13696206df722e72998","img:7e50a7160fd420a55345e0335eb6082fdb450561","음악교실 프로그램참여~~"]},
  {"key":"kV68/80","board":"이용인 자조모임","title":"25년 3월 자조 회의 ＜ 안건 - 산책＞","date":"2025-04-18 18:47","blocks":["img:0d64dd3b65ea956c214bd153833fd53f4f0eee1f","img:7b2d1ba31482d2996bfcc79ceeb878f70d197475","img:06566cb9f2466539b610a740308452f0ae5c8ded","img:c9812d08c04e50303c62674f3efba7fc3d70be02","img:c4acdb91f9b92663ae7dcd9ceac16681822f7d1b","img:daeaec6f9937fe8811dc69d0b39e5d33758d64b1"]},
  {"key":"kV68/81","board":"이용인 자조모임","title":"25년 4월 자조회의 ＜ 안건- 꽃 심기＞","date":"2025-04-18 18:52","blocks":["img:300a01cf1f66e6c4a352401603b48f2ba03a9a2f","img:3caa18d9ec8f05569cbd85be9fbea8697035a6b9","img:25c356904a2f247bb9c5311750489f58e08b10b6","img:a212389c5999415d8ff7ff40a80c064db1eaa4d7","동생들을 위해 열심히 꽃을 심어 주는 이용인... 더운데 고생이 많죠? 꽃심기가 끝나고 시원한 커피도 한잔 하셨답니다.","< ... 사진엔 나오지 않았지만 선생님들도 옆에서 함께 하셨답니다... 혼자 한건 아니라는것.. !!>"]},
  {"key":"kF14/194","board":"외부강사지원","title":"25년 04월 레크리에이션 / 외부강사지원","date":"2025-04-28 13:24","blocks":["img:8315d4f707bc56e26ffdd40ed1229a7a719deda5","img:f0ca94d7e7a8f31bf0d918600183314c8bef6460","img:50c25e075fbe08a4cc01255858ef12df702505d9","img:d5ae5eeaaae287d21aa74985fcd86f6f6ee0baa7","img:f43f12bfa44948136b0124805b3f49c6608267ea","img:de05781b47255d932382ab8fc6fb43938780c9cc","img:88b596ec9b86fe19cdf4e866cacc5154030cecd0","img:ece1563197e75a89481c1a960c3ee5cf44172530"]},
  {"key":"kF14/195","board":"외부강사지원","title":"4월 장애인체육회(뉴스포츠) 프로그램진행","date":"2025-05-02 16:56","blocks":["4월 뉴-스포츠프로그램활동사","img:8ce473f645680300b26d7a1276bab7a535722522","img:ec808b458a102047526e999556c59253fd2669db","img:6a28ee620dd0c83011ab5fcef338e1deb2f9f9af","img:8f13958387ad4be6ac3e633f799467d32d6c5a4e","img:524a4cc3a1571588473e1c04947960cca63c729e","img:f4aeed09587b7fa354dfb5e08d051d4e95ebf566"]},
  {"key":"kPRX/53","board":"지역사회교류지원","title":"4월 장애인종합사회복지관 (날아라 음악교실)","date":"2025-05-02 17:00","blocks":["4월 날아라음악교실프로그램진행결과 사진","img:8973d80ec9a23307e12d7c2f1e7e934d14efe468","img:b21e16668de65919459d68c2af36bebd4f456710","img:74208ef82f3530a040a45eecd5240ca96fc9d02a"]},
  {"key":"kV68/82","board":"이용인 자조모임","title":"25년 5월 자조 회의 (모임) ＜ 안건: 가정의 달 맞이 카네이션 화분 만들기＞","date":"2025-05-03 15:36","blocks":["가정의 달입니다. 어린이날, 어버이날, 스승의날< 25년 부터는 '세종대왕 나신날' 이라고 합니다.> , 부부의 날...","","근로자의 날을 맞이해 인애학교와 회사가 쉬는 날이라 아침일찍 회의를 진행 하였습니다.","","img:0590a47ee9b416f7fb17524c7a135ae3405cc0fe","img:5aba6479223572a0f973b2137cfda3b58cb98301","천안시 직업재활시설 : \" 천안시 꽃밭' 에 가서 화분만들기를 하고 왔습니다. 날씨가 좋아 야외에서 진행 되었고, 대답하기는 어렵지만 함께 하신 선생님들과 함께 모두들 카네이션을 잘 만들고 왔습니다.","img:62509820e63e95aaeb1b305f6974717a5f3fd282","img:05ce7547c20b6a01d14a66e86cac521ba5097f2f","img:b9eaec9956c8177bcb731698ce81799f33691ca6","img:0e1f5186871d91a7d6cebe49bd81c92339cb162e","날씨가 좋아 좋은 날이었습니다. 5월 가정의날 남은 반딧불 가족들 행복하시길 바랍니다."]},
  {"key":"kF14/196","board":"외부강사지원","title":"2025년 4월 푸드아트테라피(요리)활동","date":"2025-05-15 10:46","blocks":["▣ 4월 푸드아트테라피(요리활동)","☞ 매주 목요일 월 3회 진행 , 월1회 카페에 사진 올려 드립니다.","▣ 요리제목: \"아몬드 머핀\"","img:fe002f14f8e4564abd3a8d24663c208c9073e908","img:1c4553cc61fac10b87977600fab98e1fa8d40791","img:7cf0039490c227873949fcfd4f97037ecca7953c","img:456235da70020a9d8430087a651e63a5416dc376","img:623e080cd0e21ca938a5b35f044a9ee0e9ace578","img:95a99d4dad7fcccf6625613c7a3952a535b5f447"]},
  {"key":"kF14/197","board":"외부강사지원","title":"25년 05월 레크리에이션 / 외부강사지원","date":"2025-05-22 10:00","blocks":["img:4b81c8669fb5878fe92b0da7248c8a8332d175f6","img:96c2bab80d2365b436d0fbd536d9a7370b4a7cc6","img:d87b57789e083e6806ef2323c14872b175bee8a9","img:75ba3b423c3559e333900468442ef29c40dbca84","img:76c1d194250d4dd1f0ce75aebdea645eaa61876a","img:aba851e8342ebf1dc7e60dad94d7e275da66558a"]},
  {"key":"kF14/198","board":"외부강사지원","title":"5월 장애인체육회(뉴스포츠) 프로그램진행","date":"2025-06-03 13:34","blocks":["img:c81a80ac003d14603f993b99f70a8393666e213a","img:8ddfb43d4f04714c9cb12a0084ac1936d5169e4b","img:e527b9a1f9176e891512f3c473ade2394cc7e08b","img:90f5b47bdaa5fc78c4be0fa47747a7902c8df932","img:7d186a2d9f06ebfb89db277928b07dde4f65b907"]},
  {"key":"kPRX/54","board":"지역사회교류지원","title":"5월 장애인종합사회복지관 (날아라 음악교실)","date":"2025-06-03 13:38","blocks":["img:e3bb5f453707f964cd9de1360bb92a99cef45dd6","img:b6d5452fa5e76513f65eb28276eef12bc9ce026d","img:7bc48b11bd5766039d1aa1ab4579eaf9ed762c80"]},
  {"key":"kF14/199","board":"외부강사지원","title":"25년 06월 레크리에이션 / 외부강사지원","date":"2025-06-19 13:12","blocks":["img:86ca87b474d591e11313a0eb23d9b44946df9aff","img:0a0adc0831727f528de790f9d208db79a2ed7849","img:4d3179ef094e37c76cc243c3211c44387f4bdb48","img:4c9b2e0066beb6fe57dbaa16c6cb7ad306d7bd54"]},
  {"key":"kF14/200","board":"외부강사지원","title":"6월 장애인체육회(뉴스포츠) 프로그램진행","date":"2025-07-04 10:49","blocks":["6월 활동사진입니다~~","img:c60c8fcbe126a7e569baf34e999c44bc3f8944f3","img:dcfeeff1a0c184f8faa5cb3fefad0ed6708f4932","img:2e78e6f89e00a541ad445e0cd2a5b2b1983a2cd3","img:2552761f14d7f3e1062544c54daeb0a3f387aec2"]},
  {"key":"kPRX/55","board":"지역사회교류지원","title":"6월 장애인종합사회복지관 (날아라 음악교실)","date":"2025-07-04 10:52","blocks":["6월 활동사진입니다~~","img:6323f9a6b801289687641280f552eea85c249e7e","img:c99624d33885c650efcd763753ea4444bbaf725d"]},
  {"key":"kF14/201","board":"외부강사지원","title":"2025년 5월 푸드아트테라피(요리)활동","date":"2025-07-09 15:38","blocks":["▣ 5월 푸드아트테라피(요리활동)","☞ 매주 목요일 월 4회 진행 , 월1회 카페에 사진 올려 드립니다.","▣ 요리제목: \"햄치즈 롤\"","img:ba4be333fa472f7d64e2a41d23d76718fdc6ee12","img:5dc759a3f6674010f1bbd40f561f908fa35d43e7","img:1c0d4b91357eb9b0b231ad0aac2f83de1b7d3eb7","img:967a0bf9cd65fc3d397081ceee60ffcf0fbe5614"]},
  {"key":"kF14/202","board":"외부강사지원","title":"2025년 6월 푸드아트테라피(요리)활동","date":"2025-07-09 17:39","blocks":["▣ 6월 푸드아트테라피(요리활동)","☞ 매주 목요일 월 4회 진행 , 월1회 카페에 사진 올려 드립니다.","▣ 요리제목: \"소시지빵\"","img:1da2ff2e75a37765f9c39e5ac416e71d81105f5e","img:d440b4d368788170125addba2ff35da261d3c70e","img:1709845cb13d98cb57aea5cc23121ca508e427cc","img:7314ae30fa94ed3b4b3e8b825d9eb8b46fbe790b"]},
  {"key":"kF14/203","board":"외부강사지원","title":"7월 장애인체육회(뉴스포츠) 프로그램진행","date":"2025-07-29 11:12","blocks":["7월 프로그램 진행사진입니다~~","img:1ca2b38998121d63559250ae68274b7847df5583","img:6b589751b6fd715e29543f2fcf973889dd912ab3","img:cc55c95f2e246f59d50f661990cf0ad253307f8e","img:ebcb72a4d8ecc502c40304289d9b099b44a0d816","img:6730431054e3c17f5a3e8a2fce7de4ddd3509849","img:12b7170c5730ba433e82be3884bcb1c21266ff0b","img:05e5f339d8a0aa647783305c1e543d5bc1f18b26","img:d490f2f024f767b9330be2c6f71648a4cdeff189"]},
  {"key":"kPRX/56","board":"지역사회교류지원","title":"7월 장애인종합사회복지관 (날아라 음악교실)","date":"2025-07-29 11:22","blocks":["날아라음악교실 프로그램참여 활동입니다~~","img:42c8ea712913a2a5e16c435666f3a775576f7f96","img:38303946f5694326fdbfd8c7fbacea13232d64c3","img:9f72593803bf593bfdd59a15b8f29807df7ab325","img:b0a62493714b79a8ff48f3f0ab6e53e96a371f44"]},
  {"key":"kF14/204","board":"외부강사지원","title":"8월 장애인체육회(뉴스포츠) 프로그램진행","date":"2025-08-29 09:59","blocks":["8월 특수체육(뉴 스포츠)활동사진입니다~~","img:b135f184e5c2871b3ee371f8208a88ce6c37c6d9","img:8aad4ae6622b274125ef8a2b1c2d7fcb97896862","img:d7c636087363d653dc863158a638412e1657bc0a","img:6c9982841bf31097733024cbcb6d0fb5952c38b4","img:3dfa269662f5a73820c5dbd22a2af6e54c6eedf6","img:8684f5e23000d108adee965ddd85e0d6a34ffea8"]},
  {"key":"kPRX/57","board":"지역사회교류지원","title":"8월 장애인종합사회복지관 (날아라 음악교실)","date":"2025-09-03 16:30","blocks":["8월활동시","img:ac7792109ff88ae72cb80aa146903ed5d162ad99","img:71e0b0209c50352de132f2729ca78554dfbd971b","img:193bd52fd503e8f0d0c6f9d24da8f2cf74b9815d","img:b42122ea9cb5704a67440905672cfbbee5e3a172"]},
  {"key":"kF14/205","board":"외부강사지원","title":"9월 장애인체육회(뉴스포츠) 프로그램진행","date":"2025-10-03 11:31","blocks":["img:b42cdc4fd24be323817c5156ef81c08bde26dffe","img:7a5dc4dc95f1157ebc50470818780b162dd539ed","img:bc0ea4f5003cd1c6048233a20d94da62fef5e8a6","img:c2e178e47940c86b7ce7e40c81a2bae4860c6461","img:7718056f5fcaa664da492101dca0eadb292610c7","img:91feb079370a880d044516e05792d0b2d09fabb9","img:98f5db8d0a8f26fef08334a29761ee1a7255ee3f"]},
  {"key":"kPRX/58","board":"지역사회교류지원","title":"9월 장애인종합사회복지관 (날아라 음악교실)","date":"2025-10-03 11:33","blocks":["img:6015d960dd476b0d5278777cffe591f4f3286c37","img:7de5e8dbdffd80b3d18f8a9259f9456f48f9ef80","img:8c961c6b5865b7fbaab76c23a72156c7ced3aa01"]},
  {"key":"kF14/206","board":"외부강사지원","title":"11월 장애인체육회(뉴스포츠) 프로그램진행","date":"2025-12-04 13:01","blocks":["img:33ad2c17542b09e50ae6199b6fe87a5a35f5223b","img:8e2a182afd965ebcbc628a76cacb7b8a260dfc65","img:eb404ad455ad209d3dc4d87198a981b83bc02f36","img:d4f0b05c553d8819c0d9fe174406df1fa85cb989","img:324bd9afbc9858f1db0694b485e7eff4f7c7f4c6","img:e165dcc15a738d1ff143787f83f98eff743bd896"]},
  {"key":"kPRX/59","board":"지역사회교류지원","title":"11월 장애인종합사회복지관 (날아라 음악교실)","date":"2025-12-04 13:03","blocks":["img:1c02558ffeced6326980c483e5a9981e087e67c1","img:7a3d99b384eecadb18cfd776dd62a5f5db735eb8","img:e8e6d8d0782bfbb94cbdb9ea039f8b8385dc1d4e","img:78c3112a23f5f597a8a4b6777bc31d6b509ddfe6"]},
  {"key":"kF14/207","board":"외부강사지원","title":"12월 장애인체육회(뉴스포츠) 프로그램진행","date":"2026-01-06 19:48","blocks":["img:79d2e386c7f0c5e3a679d6c5894053124a959a72","img:b41f1e13ff43b1f7dfce49cf6b974a151bfe38e6","img:446575783723a755ed2d2b55d8f3a904a991a9f3","img:911bd84c974c760a9f91bd5984905088a57bec45","img:8df51319d9a254c55ebc74b7bb613429de05a3b3","img:a985f890bf79047acb043d763303fb60f4da0271","img:a48aa494371bf6297bc29cfc45f9c59e65f25d37"]},
  {"key":"kPRX/60","board":"지역사회교류지원","title":"12월 장애인종합사회복지관 (날아라 음악교실)","date":"2026-01-06 19:49","blocks":["img:06ee76ca3e088dc068eef52d107c39fc5ddcfcda","img:d3cfb4f53e5a863aa48696093b3b4c5760af46ba"]},
  {"key":"kV68/83","board":"이용인 자조모임","title":"26년 3월 자조 회의 (","date":"2026-03-25 14:22","blocks":["3월 자조회의를 실시하였습니다.","안건은 가까운 곳에 산책 하기 였습니다.","학생들은 토요일, 낮에 성인을 중심으로 산책 하였습니다.","img:39a0a2fc9ee9b8bfda821bb6a71e49eb625c4f69","3월 18일 오전 성성호수공원 방문자 센터 입니다.","img:e34b4775b7d10f88e2f8e5237c9c8d33dca0f43c","img:a161a11d353b98244c417b11b48405aa9ed51bb0","3월 14일 아산 신정호 나들이 다녀왔습니다."]},
  {"key":"kF14/209","board":"외부강사지원","title":"2026년 1월 레크리에이션 활동","date":"2026-03-25 14:47","blocks":["img:69d2791076a7b340c33b04c79f5690a57ee78c61","img:246a3b12f10eb3c24e5ed8f1593da4224b75bd17","img:50315028a9c1f371f0898752170cc75523471f81","img:55d2b5616250c2f06131190fa13c7f7949b23d10"]},
  {"key":"kF14/210","board":"외부강사지원","title":"2026년 2월 특수체육 프로그램","date":"2026-03-25 15:58","blocks":["img:17487bad9731d7a751ded52a36f86ff999ba74d5","img:c9674533d4b57699b53acb860428557dfc5b173b","img:fa33045628529fda4cf86cfa45518b766dd90c7a","img:26d43f5b0b7cde64d2f4b34d996b07f2c6186513","img:831d68c49af4094f8ae11062c660693eb946ed4b","img:9fd3f5acad515d208af7a95b284a35433c58a296"]},
  {"key":"kPRX/61","board":"지역사회교류지원","title":"2026년 3월 칼림바 (두정장애인종합복지관)","date":"2026-03-25 16:05","blocks":["img:dd209a487a515f02fb501b7cff1bb583c56b53d9","img:e0e09ccf03f00ba4656c2091e49dff5ce045a9f6","img:ea1b8a21520480477737e893bc6dfb04fcc4e8f3"]},
  {"key":"kPRX/63","board":"지역사회교류지원","title":"2026년 03월 드로잉 활동지원","date":"2026-04-01 16:30","blocks":["두정장애인종합복지관(드로잉)프로그램 참여","img:55145416b545dbc866af0d4c6c63e3fca2a53474","img:20f0ea0c856115cefba69d34e6b8a583831f504b","img:dbc61da4b378ec85ab9693d8632d0484f70f3c79","img:5d764d2f55bb963141eafd5edcd788647a102a4b"]},
  {"key":"kF14/211","board":"외부강사지원","title":"5월 특수체육활동","date":"2026-07-01 15:53","blocks":["천안시 장애인체육회 특수체육프로그램 활동","img:dc247c6a7ed98275af2716adc998288770d0e55e","img:86fa9967d575eaf7c7a3b8253bddaec15bafdb69","img:70ddad23a6c219d2ca1d0531b145981f107a4ed3","img:ae2c5069965e5dd490a06724fd2a3cbccc6171ef","img:d1b37601ac567b0d972a4a5b2e7c421b0c8398d2","img:560462b0137e4c9a862150a5c37d9f357209a1f8","img:f56921b201b1bd5af8822f6e90cc9344915f3498"]},
  {"key":"kPRX/64","board":"지역사회교류지원","title":"장애인종합복지관","date":"2026-07-01 16:09","blocks":["5월 칼림바/드로잉/줄넘기 프로그램활동","img:0b2817f10e4361e8e0020a92bc1a219e2b49da6c","img:ccf84f01b32def0294c418b587478e61f9b16fc4","img:b9374fc47a6370b60e3d524070fde155cddd53ee","img:89f85f750d258fac645f9233488dfb2eeac8f828","img:cac4c583e747428666a21c2ad9df387663d3798c","img:7127dd03aae356e4f34b30f6803f41869b8d4773","img:eb616b4c38b17b5ba5b8be5467d08470e2341851","img:12ade9ce17e7784a04f7564b07f0e0a8834eca87"]}
];

const CAFE_BATCHES = {
  meeting: {
    posts: function () { return CAFE_MEETING_POSTS; },
    category: '열린운영',
    folder: '반딧불_홈페이지_카페이전사진_회의',
    propKey: 'CAFE_MEETING_IMPORT_DONE_V1',
    handler: 'importCafeMeetingPosts'
  },
  edu: {
    posts: function () { return CAFE_EDU_POSTS; },
    category: '배움',
    folder: '반딧불_홈페이지_카페이전사진_교육',
    propKey: 'CAFE_EDU_IMPORT_DONE_V1',
    handler: 'importCafeEduPosts'
  },
  volunteer: {
    posts: function () { return CAFE_VOLUNTEER_POSTS; },
    category: '나눔동행',
    folder: '반딧불_홈페이지_카페이전사진_자원봉사',
    propKey: 'CAFE_VOLUNTEER_IMPORT_DONE_V1',
    handler: 'importCafeVolunteerPosts'
  },
  daily: {
    posts: function () { return CAFE_DAILY_POSTS; },
    category: '소소한일상',
    folder: '반딧불_홈페이지_카페이전사진_일상',
    propKey: 'CAFE_DAILY_IMPORT_DONE_V1',
    handler: 'importCafeDailyPosts'
  }
};

function importCafeMeetingPosts() { runCafeBatch_('meeting'); }
function importCafeEduPosts() { runCafeBatch_('edu'); }
function cafeMeetingImportStatus() { logCafeBatchStatus_('meeting'); }
function cafeEduImportStatus() { logCafeBatchStatus_('edu'); }
function importCafeVolunteerPosts() { runCafeBatch_('volunteer'); }
function cafeVolunteerImportStatus() { logCafeBatchStatus_('volunteer'); }
function importCafeDailyPosts() { runCafeBatch_('daily'); }
function cafeDailyImportStatus() { logCafeBatchStatus_('daily'); }

/**
 * 이미 시트에 들어간 글 본문에서 이용인 이름을 지웁니다. (2023년 4분기 인권지킴이단회의 글)
 */
function removeResidentNamesFromStories() {
  const REPLACES = [
    ['- 내부단원 : 이순옥(간사). 임희찬위원', '- 내부단원 : 이순옥(간사). 이용인 위원']
  ];
  const sheet = getStorySheet_();
  const colMap = getHeaderIndexMap_(sheet);
  const values = sheet.getDataRange().getValues();
  let changed = 0;
  for (let i = 1; i < values.length; i++) {
    let content = String(values[i][colMap['Content']] || '');
    const before = content;
    REPLACES.forEach(function (r) { content = content.split(r[0]).join(r[1]); });
    if (content === before) continue;
    sheet.getRange(i + 1, colMap['Content'] + 1).setValue(content);
    Logger.log('이름 지움: ' + values[i][colMap['Title']]);
    changed++;
  }
  invalidateCache_(CACHE_KEY_STORIES);
  Logger.log('완료: ' + changed + '개 글을 고쳤습니다.');
}

/**
 * 「소소한일상」에 예전에 직접 올렸던 글 10개를 시트에서 지웁니다.
 * 아래 목록의 글 ID와 정확히 같은 행만 지우므로, 카페에서 새로 옮겨온 글은 지워지지 않습니다.
 * (본문 사진 파일은 드라이브에 그대로 남습니다.)
 */
function deleteOldDailyPosts() {
  const IDS = [
    '26100641-9838-4163-ac59-b13c5bfeeede', // 23년 10월 레크레이션 활동
    'bac80751-48e3-4750-8928-36fff9678e23', // 23년 10월 푸드아트테라 활동
    'a840d601-23e9-4b5f-8207-0a8ba0e68e59', // 23년 11월 푸드아트테라피 활동
    '2d9b8ebf-ece7-44a1-813c-bdd5e1d08a40', // 23년 11월 레크레이션 활동
    'b9f748ea-bfbe-4878-91fa-8d107bfa1a65', // 23년 12월 레크레이션 활동
    '06e811f6-aad3-49cd-89c3-3ab8c7f29916', // 23년 12월 푸드아트테라피 활동
    'ff09ea2e-c89c-4377-9d31-f436ad77da55', // 24년 1월 레크레이션 활동
    '12020243-02b9-433c-9d60-249e213ba8a7', // 24년 1월 푸드아트테라피 활동
    '05f104c3-c06c-40ad-a66b-779f394e89c0', // 24년 1월 장애인체육회
    '33a48a03-395c-4df6-b35c-867487e6df2b'  // 24년 천안시장애인종합복지관 종이공예 활동
  ];
  const sheet = getStorySheet_();
  const colMap = getHeaderIndexMap_(sheet);
  const values = sheet.getDataRange().getValues();
  let deleted = 0;
  // 아래쪽 행부터 지워야 행 번호가 밀리지 않습니다.
  for (let i = values.length - 1; i >= 1; i--) {
    if (IDS.indexOf(values[i][colMap['ID']]) === -1) continue;
    Logger.log('삭제: ' + values[i][colMap['Title']]);
    sheet.deleteRow(i + 1);
    deleted++;
  }
  invalidateCache_(CACHE_KEY_STORIES);
  Logger.log('완료: ' + deleted + '개 글을 지웠습니다.');
}

/**
 * 1차로 옮긴 글 중 산타행사·따사모(따뜻한맘을가진사람들의모임)와 함께한 글을 「나눔동행」으로 옮깁니다.
 * 제목이 정확히 같고, 지금 「특별한날」 또는 「소소한일상」에 있는 글만 바꿉니다.
 */
function moveVolunteerPostsToSharing() {
  const TITLES = [
    '23년12월16일(토) 산타잔치 지원',
    '24년 12월14일 반딧불 산타행사',
    '24.11.02 자원봉사자와 추계여행',
    '24.12.14. 산타행사 지원',
    '24.12.14. 산타행사 2',
    '2025년 태안 청산수목원(자원봉사단 따사모)',
    '2025년 산타행사(자원봉사단 따사모)',
    '2026년 파주헤이리마을(자원봉사단 따사모)',
    '2026년 따사모(자원봉사자)와 함께 하는 사회체험학습'
  ];
  const sheet = getStorySheet_();
  const colMap = getHeaderIndexMap_(sheet);
  const values = sheet.getDataRange().getValues();
  let moved = 0;
  for (let i = 1; i < values.length; i++) {
    const title = values[i][colMap['Title']];
    const cat = values[i][colMap['Category']];
    if (TITLES.indexOf(title) === -1) continue;
    if (cat !== '특별한날' && cat !== '소소한일상') continue;
    sheet.getRange(i + 1, colMap['Category'] + 1).setValue('나눔동행');
    Logger.log('나눔동행으로 이동: ' + title);
    moved++;
  }
  invalidateCache_(CACHE_KEY_STORIES);
  Logger.log('완료: ' + moved + '개 글을 「나눔동행」으로 옮겼습니다.');
}

function runCafeBatch_(name) {
  const cfg = CAFE_BATCHES[name];
  const posts = cfg.posts();
  const started = Date.now();
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    Logger.log('이미 다른 가져오기 작업이 실행 중입니다. 잠시 후 다시 시도하세요.');
    return;
  }
  try {
    ScriptApp.getProjectTriggers().forEach(function (t) {
      if (t.getHandlerFunction() === cfg.handler) ScriptApp.deleteTrigger(t);
    });
    const props = PropertiesService.getScriptProperties();
    const done = JSON.parse(props.getProperty(cfg.propKey) || '{}');
    const sheet = getStorySheet_();
    const folder = getOrCreateDriveFolder_(cfg.folder);
    let added = 0, skipped = 0, failedImages = 0;

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      if (done[post.key]) { skipped++; continue; }
      if (Date.now() - started > CAFE_IMPORT_TIME_LIMIT_MS) {
        ScriptApp.newTrigger(cfg.handler).timeBased().after(60 * 1000).create();
        Logger.log('시간이 다 되어 여기서 멈춥니다. 1분 뒤 자동으로 이어서 실행됩니다. (이번에 ' + added + '개 추가)');
        invalidateCache_(CACHE_KEY_STORIES);
        return;
      }

      const parts = [];
      let imgNo = 0;
      post.blocks.forEach(function (block) {
        if (block.indexOf('img:') === 0) {
          imgNo++;
          try {
            const res = UrlFetchApp.fetch(CAFE_IMAGE_URL_PREFIX + block.substring(4), { muteHttpExceptions: true });
            if (res.getResponseCode() !== 200) throw new Error('HTTP ' + res.getResponseCode());
            const file = folder.createFile(res.getBlob().setName('cafe_' + post.key.replace('/', '_') + '_' + imgNo + '.jpg'));
            file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            parts.push('<img src="https://drive.google.com/thumbnail?id=' + file.getId() + '&amp;sz=w1200" class="content-resizable-img">');
          } catch (err) {
            failedImages++;
            Logger.log('사진 실패: ' + post.title + ' #' + imgNo + ' - ' + err);
          }
        } else if (block === '') {
          parts.push('<div><br></div>');
        } else {
          parts.push('<div>' + escapeHtmlForImport_(block) + '</div>');
        }
      });

      const dateOnly = post.date.substring(0, 10);
      sheet.appendRow(buildRowByHeaderNames_(sheet, STORY_HEADERS, {
        ID: Utilities.getUuid(),
        Category: cfg.category,
        Title: post.title,
        Content: parts.join(''),
        Date: dateOnly,
        ThumbnailURL: '',
        ThumbnailFileId: '',
        FileURL: '',
        FileName: '',
        Views: 0,
        AttachmentsJSON: '[]',
        CreatedAt: Utilities.parseDate(post.date, 'Asia/Seoul', 'yyyy-MM-dd HH:mm'),
        PdfFileId: ''
      }));
      done[post.key] = true;
      props.setProperty(cfg.propKey, JSON.stringify(done));
      added++;
      Logger.log('추가: [' + post.board + '] ' + post.title + ' (' + dateOnly + ')');
    }
    invalidateCache_(CACHE_KEY_STORIES);
    Logger.log('완료! 「' + cfg.category + '」에 이번에 ' + added + '개 추가, 이미 있던 글 ' + skipped + '개 건너뜀, 실패한 사진 ' + failedImages + '장');
  } finally {
    lock.releaseLock();
  }
}

function logCafeBatchStatus_(name) {
  const cfg = CAFE_BATCHES[name];
  const posts = cfg.posts();
  const done = JSON.parse(PropertiesService.getScriptProperties().getProperty(cfg.propKey) || '{}');
  const remaining = posts.filter(function (p) { return !done[p.key]; });
  Logger.log('「' + cfg.category + '」 전체 ' + posts.length + '개 중 ' + (posts.length - remaining.length) + '개 완료, ' + remaining.length + '개 남음');
}

function escapeHtmlForImport_(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
