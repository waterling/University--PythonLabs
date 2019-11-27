import React, { SyntheticEvent, useEffect, useState } from 'react';
import placeholder from './placeholder.png';
import './App2.css';


const apiPrefix = '/api';

const API = {
    ADD_RSS: `/add-rss`,
    GET_RSS_LIST: '/get-rss-list',
    RELOAD_RSS: '/reload-rss',
    GET_RSS_RECORDS: '/get-records',
};

const defaultErrorText = 'Что-то пошло не так :(';
const MIN_TIMEOUT = 4 * 1000;
const PAGE_SIZE = 5;

const defaultSummary = '<div style="text-align:center;"><img src="https://habrastorage.org/getpro/habr/post_images/6ec/6e0/8b6/6ec6e08b66332faa2513d376040c4b15.png" alt="image"></div><br>\n<br>\n<i>Данные от 200 000 пользователей iPhone</i><br>\n<br>\nТристан Харрис — борец с Facebook, Google и другими крупными корпорациями. Его называют «Совестью Кремниевой долины». Его основной посыл — что тысячи специалистов в сотнях ИТишных компаниях борются за то, чтобы вы отвлекались от полноценной жизни и залипали в телефон. У него интереснейшее выступление на TED и несколько переводов на Хабре.<br>\n<br>\n<ul>\n<li><b>Хабр: </b><a href="https://habr.com/ru/post/450068/">Как технологии манипулируют вашим разумом: взгляд иллюзиониста и эксперта по этике дизайна Google</a> (<a href="https://habr.com/ru/post/301786/">альтернативная версия</a>)</li>\n<li><b>TED:</b> <a href="https://www.ted.com/talks/tristan_harris_how_better_tech_could_protect_us_from_distraction/discussion?language=ru">Как усовершенствованные технологии помогут нам сосредоточиться</a></li>\n</ul><br>\n<br>\nВ этом переводе даны практический советы, как понизить власть приложений над вашей жизнью. <a href="https://habr.com/ru/post/477438/?utm_source=habrahabr&amp;utm_medium=rss&amp;utm_campaign=477438#habracut">Читать дальше →</a>';

interface Record {
    id: string;
    link: string;
    published: string;
    summary: string;
}

interface AddRSS {
    _id: {
        '$oid': string
    };
    url: string;
    title: string;
    loading?: boolean;
}

interface Pagination {
    page: number;
    size: number;
    total: number;
}

interface RecordsResponse {
    records: Record[];
    pagination: Pagination;
}

interface Error {
    error: string;
}

interface NewsForm {
    title?: string;
    url?: string;
}

const App: React.FC = () => {

    const [newsForm, setNewsForm] = useState<NewsForm>({});
    const [rssList, setRssList] = useState<AddRSS[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [currentRss, setCurrentRss] = useState<string | null>(null);
    const [rssRecords, setRssRecords] = useState<RecordsResponse | null>(null);

    useEffect(() => {
        handleGetRssList();
    }, []);


    const handleGetRssRecords = async (id: string, page: number = 0, size: number = PAGE_SIZE) => {
        try {
            const query = `rss=${id}&page=${page}&size=${size}`;
            const response: RecordsResponse = await getJson(`${API.GET_RSS_RECORDS}?${query}`);
            setRssRecords(response);
        } catch {
            setError(defaultErrorText)
        }
    };

    const handleGetRssList = async () => {
        try {
            const response: AddRSS[] = await getJson(API.GET_RSS_LIST);
            setRssList(response);
        } catch {
            setError(defaultErrorText)
        }
    };

    const handleReloadRss = async (id: string) => {
        const item = rssList.find(i => i._id.$oid === id);
        if (item && item.loading) {
            return;
        }

        setRssList(setLoadingRssItem(rssList, id, true));
        try {
            const query = `rss=${id}`;
            await getJson(`${API.RELOAD_RSS}?${query}`);
        } catch {
            setError(defaultErrorText)
        }
        setRssList(setLoadingRssItem(rssList, id, false));
    };

    const handleChooseRss = (id: string) => {
        setCurrentRss(id);
        handleGetRssRecords(id);
    };


    const handleChangeNewsForm = (e: SyntheticEvent<HTMLInputElement, Event>) => {
        setNewsForm({ ...newsForm, [e.currentTarget.name]: e.currentTarget.value })
    };

    const handleAddRss = async () => {
        try {
            const response: AddRSS[] = await post(API.ADD_RSS, newsForm);
            setRssList(response);
        } catch {
            setError(defaultErrorText)
        }
    };

    if (error) {
        return (
          <div className="App">
              <div className="App-error">
                  Что-то пошло не так
              </div>
          </div>
        );
    }

    const showPagination = rssRecords && rssRecords.pagination.total > rssRecords.pagination.page * rssRecords.pagination.size;
    const countOfPages = rssRecords && Math.ceil(rssRecords.pagination.total / PAGE_SIZE);

    console.log('rssList', rssList)
    return (
      <div className="App">
          <div className="app-main">
              <div className="left">
                  <div className="left-menu">
                      <div className='left-menu__item'>
                          <label>Title</label>
                          <input type="text" value={newsForm.title} name="title" onChange={handleChangeNewsForm} />
                      </div>
                      <div className='left-menu__item'>
                          <label>Url</label>
                          <input type="text" value={newsForm.url} name="url" onChange={handleChangeNewsForm} />
                      </div>
                      <div className='left-menu__item'>
                          <button className='left-menu__item-button' onClick={handleAddRss}>
                              Add
                          </button>
                      </div>
                  </div>

                  <div className='left-list'>
                      {rssList.map(item => (
                        <div className='left-list__item' key={item._id.$oid}>
                            <button className="left-list__button" data-loading={item.loading}
                                    onClick={() => handleReloadRss(item._id.$oid)}>&#x21bb;</button>
                            <span onClick={() => handleChooseRss(item._id.$oid)}>
                                {item.title}
                            </span>
                        </div>
                      ))}

                  </div>

              </div>
              <div className="news">
                  <div className="news-list">
                      {currentRss && rssRecords && rssRecords.records.map(record => (
                        <div className="news-list__item" key={record.id}>
                            <div dangerouslySetInnerHTML={{ __html: record.summary }} />
                        </div>
                      ))}

                      <div className="news-list__pagination">
                          {currentRss && rssRecords && showPagination && Array.from(Array(countOfPages)).map((_, i) => (
                            <button
                              className="news-list__pagination-item"
                              key={i + 1}
                              data-current={i === rssRecords.pagination.page}
                              onClick={() => handleGetRssRecords(currentRss, i)}
                            >
                                {i + 1}
                            </button>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      </div>
    );
};


const formatResult = (currentName: string, resultName: string, winName: string) => {
    if (currentName === resultName) {
        return currentName === winName ? 'win' : 'lose';
    } else if (resultName) {
        return currentName === winName ? 'win' : '';
    }
    return '';
};


const getJson = async (input: string) => {
    const response = await fetch(input, {
        method: 'GET',
    });
    return response.json();
};

const post = async (input: string, body: {}) => {
    const response = await fetch(input, {
        method: 'POST',
        body: JSON.stringify(body),
    });
    return response.json();
};

const setLoadingRssItem = (list: AddRSS[], id: string, loading: boolean): AddRSS[] => {
    const rssIndex = list.findIndex(i => i._id.$oid === id);
    const newList = [...list];
    newList[rssIndex].loading = loading;
    return newList;
};


export default App;
