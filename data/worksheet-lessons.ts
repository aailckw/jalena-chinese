import type { LessonWeek, PracticeItem, SentenceFrameItem } from "@/lib/lesson-schema";

function itemFromFrame(f: SentenceFrameItem): PracticeItem {
  return {
    id: f.id,
    displayText: f.displayText,
    expectedAnswer: f.canonicalAnswer,
    alternatives: f.acceptedAnswers.filter((a) => a !== f.canonicalAnswer),
    frame: f,
  };
}

function itemSimple(
  id: string,
  displayText: string,
  expectedAnswer: string,
  alternatives?: string[]
): PracticeItem {
  return { id, displayText, expectedAnswer, alternatives };
}

/**
 * Lesson data from the 2025/26 低班中文字卡——句式練習 worksheet.
 * Sentences are represented as frames with slots for combination practice.
 */
const LESSON_WEEKS: LessonWeek[] = [
  {
    id: "2-7",
    dateRange: "9/2-19/3",
    theme: "環保小天使 (農曆新年)",
    vocabulary: ["報紙", "回收箱", "珍惜", "電力", "罐子", "冰箱", "食物", "減少", "瓶子", "購物袋", "食水", "垃圾"],
    sentences: [
      itemFromFrame({
        id: "2-7-s1",
        frame: "我把{object}放進{place}",
        displayText: "我把報紙放進回收箱。(罐子/瓶子/衣物)",
        slots: [
          { id: "object", label: "物件", category: "object", options: ["報紙", "罐子", "瓶子", "衣物"] },
          { id: "place", label: "地方", category: "place", options: ["回收箱"] },
        ],
        canonicalAnswer: "我把報紙放進回收箱",
        acceptedAnswers: ["我把報紙放進回收箱", "我把罐子放進回收箱", "我把瓶子放進回收箱", "我把衣物放進回收箱"],
      }),
      itemFromFrame({
        id: "2-7-s2",
        frame: "{person}把{object}放進{place}",
        displayText: "爸爸(人物)把食物(飲品)放進冰箱。",
        slots: [
          { id: "person", label: "人物", category: "person", options: ["爸爸", "媽媽"] },
          { id: "object", label: "物件", category: "object", options: ["食物", "飲品"] },
          { id: "place", label: "地方", category: "place", options: ["冰箱"] },
        ],
        canonicalAnswer: "爸爸把食物放進冰箱",
        acceptedAnswers: ["爸爸把食物放進冰箱", "媽媽把食物放進冰箱", "爸爸把飲品放進冰箱", "媽媽把飲品放進冰箱"],
      }),
      itemFromFrame({
        id: "2-7-s3",
        frame: "我會帶備購物袋買{object}",
        displayText: "我會帶備購物袋買衣服。(食物/圖書)",
        slots: [{ id: "object", label: "物件", category: "object", options: ["衣服", "食物", "圖書"] }],
        canonicalAnswer: "我會帶備購物袋買衣服",
        acceptedAnswers: ["我會帶備購物袋買衣服", "我會帶備購物袋買食物", "我會帶備購物袋買圖書"],
      }),
      itemFromFrame({
        id: "2-7-s4",
        frame: "我會珍惜{object}",
        displayText: "我會珍惜食物。(食水/電力)",
        slots: [{ id: "object", label: "物件", category: "object", options: ["食物", "食水", "電力"] }],
        canonicalAnswer: "我會珍惜食物",
        acceptedAnswers: ["我會珍惜食物", "我會珍惜食水", "我會珍惜電力"],
      }),
      itemFromFrame({
        id: "2-7-s5",
        frame: "我要減少{object}",
        displayText: "我要減少垃圾。(廚餘)",
        slots: [{ id: "object", label: "物件", category: "object", options: ["垃圾", "廚餘"] }],
        canonicalAnswer: "我要減少垃圾",
        acceptedAnswers: ["我要減少垃圾", "我要減少廚餘"],
      }),
    ],
  },
  {
    id: "8-12",
    dateRange: "23/3-24/4",
    theme: "我想養小狗 (復活節/清明節)",
    vocabulary: ["小狗", "兔子", "倉鼠", "水族館", "小鳥", "金魚", "復活節", "小貓", "烏龜", "寵物店", "百合花", "照顧"],
    sentences: [
      itemFromFrame({
        id: "8-12-s1",
        frame: "{person}養了一隻{animal}",
        displayText: "哥哥(人物)養了一隻小鳥(小狗/小貓)。",
        slots: [
          { id: "person", label: "人物", category: "person", options: ["哥哥", "姐姐"] },
          { id: "animal", label: "動物", category: "object", options: ["小鳥", "小狗", "小貓"] },
        ],
        canonicalAnswer: "哥哥養了一隻小鳥",
        acceptedAnswers: ["哥哥養了一隻小鳥", "哥哥養了一隻小狗", "哥哥養了一隻小貓", "姐姐養了一隻小鳥", "姐姐養了一隻小狗", "姐姐養了一隻小貓"],
      }),
      itemFromFrame({
        id: "8-12-s2",
        frame: "{animal1}水裏游{animal2}陸上走",
        displayText: "金魚(烏龜)水裏游,小狗(小貓)陸上走。",
        slots: [
          { id: "animal1", label: "動物", category: "object", options: ["金魚", "烏龜"] },
          { id: "animal2", label: "動物", category: "object", options: ["小狗", "小貓"] },
        ],
        canonicalAnswer: "金魚水裏游小狗陸上走",
        acceptedAnswers: ["金魚水裏游小狗陸上走", "烏龜水裏游小貓陸上走", "金魚水裏游小貓陸上走", "烏龜水裏游小狗陸上走"],
      }),
      itemFromFrame({
        id: "8-12-s3",
        frame: "{place}裏有{animal}",
        displayText: "寵物店(水族館)裏有小貓(小狗/金魚/烏龜)。",
        slots: [
          { id: "place", label: "地方", category: "place", options: ["寵物店", "水族館"] },
          { id: "animal", label: "動物", category: "object", options: ["小貓", "小狗", "金魚", "烏龜"] },
        ],
        canonicalAnswer: "寵物店裏有小貓",
        acceptedAnswers: ["寵物店裏有小貓", "寵物店裏有小狗", "水族館裏有金魚", "水族館裏有烏龜", "寵物店裏有金魚", "寵物店裏有烏龜", "水族館裏有小貓", "水族館裏有小狗"],
      }),
      itemFromFrame({
        id: "8-12-s4",
        frame: "{animal}很可愛",
        displayText: "兔子很可愛。(倉鼠/小貓/小狗)",
        slots: [{ id: "animal", label: "動物", category: "object", options: ["兔子", "倉鼠", "小貓", "小狗"] }],
        canonicalAnswer: "兔子很可愛",
        acceptedAnswers: ["兔子很可愛", "倉鼠很可愛", "小貓很可愛", "小狗很可愛"],
      }),
      itemFromFrame({
        id: "8-12-s5",
        frame: "{animal}是我的寵物",
        displayText: "小貓是我的寵物。(小狗/倉鼠)",
        slots: [{ id: "animal", label: "動物", category: "object", options: ["小貓", "小狗", "倉鼠"] }],
        canonicalAnswer: "小貓是我的寵物",
        acceptedAnswers: ["小貓是我的寵物", "小狗是我的寵物", "倉鼠是我的寵物"],
      }),
      itemFromFrame({
        id: "8-12-s6",
        frame: "我會照顧{animal}",
        displayText: "我會照顧小狗。(小貓)",
        slots: [{ id: "animal", label: "動物", category: "object", options: ["小狗", "小貓"] }],
        canonicalAnswer: "我會照顧小狗",
        acceptedAnswers: ["我會照顧小狗", "我會照顧小貓"],
      }),
      itemSimple("8-12-s7", "復活節,百合花兒開。", "復活節百合花兒開"),
    ],
  },
  {
    id: "13-17",
    dateRange: "27/4-28/5",
    theme: "我能戰勝病菌 (勞動節/佛誕)",
    vocabulary: ["病菌", "洗澡", "清潔", "抹布", "抹汗", "洗手", "擦桌子", "吸塵機", "抹嘴巴", "保持", "地板", "清洗"],
    sentences: [
      itemFromFrame({
        id: "13-17-s1",
        frame: "{person}用{tool}{action}",
        displayText: "媽媽(人物)用抹布(吸塵機)擦桌子(擦椅子/清潔地板)。",
        slots: [
          { id: "person", label: "人物", category: "person", options: ["媽媽", "姐姐"] },
          { id: "tool", label: "工具", category: "tool", options: ["抹布", "吸塵機"] },
          { id: "action", label: "動作", category: "action", options: ["擦桌子", "擦椅子", "清潔地板"] },
        ],
        canonicalAnswer: "媽媽用抹布擦桌子",
        acceptedAnswers: ["媽媽用抹布擦桌子", "媽媽用吸塵機清潔地板", "姐姐用抹布擦椅子", "媽媽用抹布擦椅子", "媽媽用抹布清潔地板", "姐姐用抹布擦桌子", "姐姐用吸塵機清潔地板"],
      }),
      itemFromFrame({
        id: "13-17-s2",
        frame: "我會用毛巾{action}",
        displayText: "我會用毛巾抹汗。(抹嘴巴/抹手)",
        slots: [{ id: "action", label: "動作", category: "action", options: ["抹汗", "抹嘴巴", "抹手"] }],
        canonicalAnswer: "我會用毛巾抹汗",
        acceptedAnswers: ["我會用毛巾抹汗", "我會用毛巾抹嘴巴", "我會用毛巾抹手"],
      }),
      itemFromFrame({
        id: "13-17-s3",
        frame: "我每天{action}",
        displayText: "我每天洗手。(刷牙/洗臉/洗澡)",
        slots: [{ id: "action", label: "動作", category: "action", options: ["洗手", "刷牙", "洗臉", "洗澡"] }],
        canonicalAnswer: "我每天洗手",
        acceptedAnswers: ["我每天洗手", "我每天刷牙", "我每天洗臉", "我每天洗澡"],
      }),
      itemFromFrame({
        id: "13-17-s4",
        frame: "{person}在{action}",
        displayText: "姐姐(人物)在擦桌子(清潔地板)。",
        slots: [
          { id: "person", label: "人物", category: "person", options: ["姐姐", "媽媽"] },
          { id: "action", label: "動作", category: "action", options: ["擦桌子", "清潔地板"] },
        ],
        canonicalAnswer: "姐姐在擦桌子",
        acceptedAnswers: ["姐姐在擦桌子", "姐姐在清潔地板", "媽媽在擦桌子", "媽媽在清潔地板"],
      }),
      itemFromFrame({
        id: "13-17-s5",
        frame: "請保持{place}{action}",
        displayText: "請保持環境(香港)清潔(衛生)。",
        slots: [
          { id: "place", label: "地方", category: "place", options: ["環境", "香港"] },
          { id: "action", label: "狀態", category: "action", options: ["清潔", "衛生"] },
        ],
        canonicalAnswer: "請保持環境清潔",
        acceptedAnswers: ["請保持環境清潔", "請保持香港衛生", "請保持環境衛生", "請保持香港清潔"],
      }),
      itemFromFrame({
        id: "13-17-s6",
        frame: "{person}清洗{object}",
        displayText: "媽媽(人物)清洗玩具(衣服)。",
        slots: [
          { id: "person", label: "人物", category: "person", options: ["媽媽"] },
          { id: "object", label: "物件", category: "object", options: ["玩具", "衣服"] },
        ],
        canonicalAnswer: "媽媽清洗玩具",
        acceptedAnswers: ["媽媽清洗玩具", "媽媽清洗衣服"],
      }),
    ],
  },
  {
    id: "18-21",
    dateRange: "1/6-25/6",
    theme: "假日遊香港 (端午節)",
    vocabulary: ["計劃", "九龍", "離島", "遊玩", "海洋公園", "新界", "山頂纜車", "夜景", "太平山頂", "香港島", "渡輪", "端午節"],
    sentences: [
      itemFromFrame({
        id: "18-21-s1",
        frame: "我住在{place}",
        displayText: "我住在九龍。(新界/香港島/離島)",
        slots: [{ id: "place", label: "地方", category: "place", options: ["九龍", "新界", "香港島", "離島"] }],
        canonicalAnswer: "我住在九龍",
        acceptedAnswers: ["我住在九龍", "我住在新界", "我住在香港島", "我住在離島"],
      }),
      itemFromFrame({
        id: "18-21-s2",
        frame: "我計劃到{place}遊玩",
        displayText: "我計劃到海洋公園遊玩。(太平山頂/太空館)",
        slots: [{ id: "place", label: "地方", category: "place", options: ["海洋公園", "太平山頂", "太空館"] }],
        canonicalAnswer: "我計劃到海洋公園遊玩",
        acceptedAnswers: ["我計劃到海洋公園遊玩", "我計劃到太平山頂遊玩", "我計劃到太空館遊玩"],
      }),
      itemFromFrame({
        id: "18-21-s3",
        frame: "我們乘{transport}到{place}",
        displayText: "我們乘山頂纜車(港鐵/渡輪)到太平山頂(太空館/離島)。",
        slots: [
          { id: "transport", label: "交通", category: "transport", options: ["山頂纜車", "港鐵", "渡輪"] },
          { id: "place", label: "地方", category: "place", options: ["太平山頂", "太空館", "離島"] },
        ],
        canonicalAnswer: "我們乘山頂纜車到太平山頂",
        acceptedAnswers: ["我們乘山頂纜車到太平山頂", "我們乘港鐵到太空館", "我們乘渡輪到離島", "我們乘山頂纜車到太空館", "我們乘山頂纜車到離島", "我們乘港鐵到太平山頂", "我們乘港鐵到離島", "我們乘渡輪到太平山頂", "我們乘渡輪到太空館"],
      }),
      itemFromFrame({
        id: "18-21-s4",
        frame: "我愛看美麗的{object}",
        displayText: "我愛看美麗的夜景。(風景)",
        slots: [{ id: "object", label: "物件", category: "object", options: ["夜景", "風景"] }],
        canonicalAnswer: "我愛看美麗的夜景",
        acceptedAnswers: ["我愛看美麗的夜景", "我愛看美麗的風景"],
      }),
      itemFromFrame({
        id: "18-21-s5",
        frame: "端午節{action}",
        displayText: "端午節,看龍船。(吃粽子)",
        slots: [{ id: "action", label: "動作", category: "action", options: ["看龍船", "吃粽子"] }],
        canonicalAnswer: "端午節看龍船",
        acceptedAnswers: ["端午節看龍船", "端午節吃粽子"],
      }),
    ],
  },
];

export function getLessonWeeks(): LessonWeek[] {
  return LESSON_WEEKS;
}

export function getLessonWeek(id: string): LessonWeek | undefined {
  return LESSON_WEEKS.find((w) => w.id === id);
}
