const Pagination = ({ items, pageSize, onPageChange, handlePageBack, mode }) => {
  if (items.length <= 1) {return null;}
  let pageNum = Math.ceil(items.length / pageSize);
  let pages = [...Array(pageNum+1).keys()].slice(1);
  console.log(pages);
  console.log(items);
  const {Button} = ReactBootstrap;
  let list = pages.map((x,i)=>{
    
    return (
      <Button className='page-button' key={i} onClick={onPageChange}>{i+1}</Button>
    )
  })
  return (
    <nav style={{marginLeft:'-20px'}}>
      <ul>
       <Button className='page-button-disabled' disabled={true}>Page</Button>
      {list}
      {mode == 'cards' ? <Button className='page-button' key={pages.length+2} onClick={handlePageBack}>Return to Set List</Button> : null}
      </ul>
    </nav>
  );
};

const range = (start, end) => {
  return Array(end - start + 1)
    .fill(0)
    .map((item, i) => start + i);
};

function paginate(items, pageNumber, pageSize) {
  const start = (pageNumber - 1) * pageSize;
  let page = items.slice(start, start + pageSize);
  return page;
}

const useDataApi = (initialUrl, initialData) => {
  const { useState, useEffect, useReducer } = React;
  const [url, setUrl] = useState(initialUrl);

  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: false,
    isError: false,
    data: initialData,
    sets: [],
  });

  useEffect(() => {
    let didCancel = false;
    const fetchData = async () => {
      dispatch({type: 'FETCH_INIT'})
      try {
        if (url.includes('cards')) {
          console.log('cards');
          let length = 100;
          let count = 1;
          while (length > 0) {
            const result = await axios(url+'&page='+count);
            dispatch({type: 'FETCH_SUCCESS', payload: result.data});
            count++;
            length = result.data.cards.length;
            console.log(length);
          }
        }
        else {
          const result = await axios(url);
          dispatch({type: 'FETCH_SUCCESS', payload: result.data});
        }
        
      } catch (error) {
        dispatch({type: 'FETCH_FAILURE'})
      }
      // Part 1, step 1 code goes here
    };
    fetchData();
    return () => {
      didCancel = true;
    };
  }, [url]);
  return [state, setUrl];
};

const dataFetchReducer = (state, action) => {
  let existingcards = state.data.cards;
  switch (action.type) {
    case 'FETCH_INIT':
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload.hasOwnProperty('cards') ? {cards: [...existingcards,...action.payload.cards]} : {cards:[]},
        sets: action.payload.hasOwnProperty('sets') ? action.payload.sets : [],
      };
    case 'FETCH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    default:
      throw new Error();
  }
};

// App that gets data from Hacker News url
function App() {
  const { Fragment, useState, useEffect, useReducer } = React;
  const [mode, setMode] = useState('sets');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSetPage, setCurrentSetPage] = useState(1);
  const pageSize = 5;
  const [mtgsetName, setMtgsetName] = useState('');
  //const [cards, setCards] = useState([]);

  const [{ data, sets, isLoading, isError }, doFetch] = useDataApi(
    'https://api.magicthegathering.io/v1/sets',
    {
      cards: [],
    }
  );

  //const cardSearch = (url,initial) => useDataApi(url, initial);

  const handleModeChange = (e) => {
    setCurrentSetPage(currentPage);
    doFetch('https://api.magicthegathering.io/v1/cards?set='+e.target.id);
    setMode('cards');
    let name = sets.filter(set => set.code == e.target.id)[0].name;
    setMtgsetName(name);
  }

  const handlePageBack = (e) => {
    doFetch('https://api.magicthegathering.io/v1/sets');
    setMode('sets');
    setMtgsetName('');
    setCurrentPage(currentSetPage);
  }

  const handlePageChange = (e) => {
      setCurrentPage(Number(e.target.textContent.replace('Pg ','')));
  };

  let filteredSets = sets.filter(set=> Number(set.releaseDate.substr(0,4)) >= 2018 && (set.type == 'core' || set.type == 'expansion'));
  let page = mode == 'sets' ? filteredSets : data.cards;
  if (page.length >= 1 && mode == 'sets') {
    page = paginate(page, currentPage, pageSize);
  }
  else if (page.length >= 1 && mode == 'cards') {
    page = paginate(page, currentPage, pageSize);
  }



  return (
    <Fragment>
      <div style={{padding:'20px'}}>
      <h1>Magic: the Gathering {mode == 'sets' ? 'Sets' : 'Cards'}</h1>
      {mode == 'sets' ? <h6>Click on an item to browse cards in that set.</h6> : <h6>{mtgsetName}</h6> }
      </div>
      {isLoading ? (
        <div style={{padding:'20px'}}>Loading ...</div>
      ) : (
        // Part 1, step 2 code goes here
        <ul className="list-group">
          {page.map((item,i) => (
            mode == 'sets' ? <SetDetails item={item} key={i} num={i} handleModeChange={handleModeChange}></SetDetails> : 
            <CardDetails item={item} key={i} num={i}></CardDetails>
          ))}
        </ul>
      )}
      <Pagination
        items={mode == 'sets' ? filteredSets : data.cards}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        handlePageBack={handlePageBack}
        mode={mode}
      ></Pagination>
    </Fragment>
  );
}

function SetDetails({item, num, handleModeChange}) {
  let months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return (
    <li className="list-group-item" key={num} id={item.code} onClick={handleModeChange}>
    <strong id={item.code} >{item.name}</strong><br/> 
    <span id={item.code} style={{fontSize:'0.8rem'}}>({item.type.substr(0,1).toUpperCase()}{item.type.slice(1)}, {months[Number(item.releaseDate.substr(5,2))]} {item.releaseDate.substr(8,2)} {item.releaseDate.substr(0,4)})</span>
  </li>
  )
}

function CardDetails({item, num}) {
  let abilities = { Deathtouch: ' with Deathtouch',
                    Defender: ', Defender',
                    'Double strike': ' with Double Strike',
                    Enchant: ' with Enchant',
                    Equip: ', Equip',
                    'First strike': ' with First Strike',
                    Flash: ' with Flash',
                    Flying: ' with Flying',
                    Haste: ' with Haste',
                    Hexproof: ', Hexproof',
                    Indestructible: ', Indestructible', 
                    Lifelink: ' with Lifelink',
                    Menace: ' with Menace',
                    Reach: ' with Reach',
                    Trample: ' with Trample',
                    Vigilance: ' with Vigilance',}
  let itemAbility = '';
  item.text = item.text ? item.text.replace(" (This creature can't be blocked except by creatures with flying or reach.)",".") : null;
  item.text = item.text ? item.text.replace(" (This creature deals combat damage before creatures without first strike.)",".") : null;
  for (let a in abilities) {
    let ability = abilities[a];
    if (item.text.includes(a)) {
      if (itemAbility == '') {itemAbility = ability} else {itemAbility += ability.replace('with','and')}
      item.text = item.text ? item.text.replace(a+' ',a+'\. ') : null;
      }
  };
  
  return (
    <li className="list-group-item" key={num} id={item.code} style={{backgroundColor: item.rarity == "Common" ? 'white' : item.rarity == "Uncommon" ? 'lightgray' : 'gold' }}>
    {item.imageUrl ? <img src={item.imageUrl} style={{float:'left', height: '148px', margin: '0px 10px',}}/> : null}
    <strong>{item.name}</strong> - {item.types.includes("Creature") ? item.power + '/' + item.toughness + ' ': null}{item.types ? JSON.stringify(item.types).replace(/[\["|"\]]/g,'') : null}{itemAbility} <Mana manaCost={item.manaCost} key={num}></Mana><br/> 
    <span style={{fontSize:'0.85rem'}}>{item.text}</span><br/><em style={{fontSize:'0.6rem'}}>{item.flavor}</em>
    
  </li>
  )
}

function Mana({manaCost}) {
  let manaArray = manaCost ? manaCost.replace(/^\{/,'').replace(/\}$/,'').split('}{') : null;
  return (
    <div style={{display:'flex',width:'calc('+(manaArray ? manaArray.length : 0)+' * 17)'}}>{manaArray ? manaArray.map((m,i)=>(<div key={i} className={/[WRGBU]/.test(m) ? 'mana mana-'+m : 'mana'}>{/[WRGBU]/.test(m) ? null : m}</div>)) : null}</div>
  )
}

// ========================================
ReactDOM.render(<App />, document.getElementById('root'));
