import React, { SyntheticEvent, useEffect, useState } from 'react';
import placeholder from './placeholder.png';
import './App.css';


const getGuessWho = '/api';
const defaultErrorText = 'Что-то пошло не так :(';
const MIN_TIMEOUT = 4 * 1000;

interface Info {
    photo: string;
    variants: string[];
    answer: string;
}

interface ErrorInfo {
    error: string;
}

const App: React.FC = () => {
    const [info, setInfo] = useState<Info | ErrorInfo | null>(null);
    const [result, setResult] = useState('');
    useEffect(() => { handleUpdateGameInfo() }, []);

    const handleUpdateGameInfo = async () => {
        let  gameInfo: Info | ErrorInfo;
        const start = performance.now();

        try {
            gameInfo = await getJson(getGuessWho);
        } catch (_) {
            gameInfo = { error: defaultErrorText };
        }

        const time = performance.now() - start;
        setTimeout(() => {
            setInfo(gameInfo);
            setResult('');
        }, Math.max(MIN_TIMEOUT - time, 0))
    };

    const handleChooseAnswer = (name: string) => {
        !result && setResult(name);
        handleUpdateGameInfo().catch();
    };


    if (!info || 'error' in info) {
        return (
          <div className="App">
              <div className="App-header">
                  <div>
                      {(info && info.error) || "Погодите сек..."}
                  </div>
              </div>
          </div>
        )
    }
    return (
      <div className="App">
          <div className="App-header">
              <h1 className='title'>Кто изображен на картинке?</h1>
              <img
                src={info.photo}
                className="App-logo"
                alt="guess who"
                onError={(e: SyntheticEvent<HTMLImageElement, Event>) => e.currentTarget.src = placeholder}
              />

              <div className={`radio-groups ${result && 'radio-groups__disabled'}`}>
                  {info.variants.map(item => (
                    <div
                      key={item}
                      className="radio-groups__item"
                      data-result={formatResult(item, result, info.answer)}
                      onClick={() => handleChooseAnswer(item)}
                    >
                        <label>{item}</label>
                    </div>
                  ))}
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
        method: 'GET'
    });
    return response.json();
};

export default App;
