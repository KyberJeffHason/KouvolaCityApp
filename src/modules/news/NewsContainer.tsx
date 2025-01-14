import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity} from 'react-native';
import { ArticleTitle } from './components/ArticleTitle';
import { styles } from './styles';
import { fetchNews } from './RequestService';
import { NewsArticle } from './Types';
import NavBar from './components/NavBar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const translationData = require('config/locales.json');
export type category = {
  name: string,
  id: number,
  newsCount: number,
  isActive: boolean,
  isScrolling: boolean,
}

interface Props {
  navigation: any
  returnToTop: () => void
}

export const NewsContainer: React.FC<Props> = (props) => {

  const [categories, setCategories] = useState<category[]>([])  
  const [activeCategories, setActiveCategories] = useState<category[]>([])
  const [newsList, setNewsList] = useState<NewsArticle[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [newsCount, setNewsCount] = useState(0)  

  useEffect(() => {
    getCategoryData();
  }, [])

  const getCategoryData = async () => {
    let activeCategoryIDs: number[] = []
    let newCategories: category[] = []
    let newActiveCategories: category[] = []

    const url: string = 'https://www.kouvola.fi/wp-json/wp/v2/categories/?per_page=100&orderby=count&order=desc';

    let response: Response | null = null;
    try {
      response = await fetch(url)
    } catch {
      response = null;
      setErrorMessage(translationData.Labels.finnish.ErrorMessages.ErrorLoadingCategories)
      setIsLoading(false)
    }

    let savedCategories = await AsyncStorage.getItem("activeCategoryIDs")
    activeCategoryIDs = (savedCategories && savedCategories.length !== 0) ? JSON.parse(savedCategories) : [17]


    if (response) {
      const json = await response.json()
      json.forEach((field: any) => {
        if (field.count > 0) {
          let category: category = {name: field.name, id: field.id, newsCount: field.count, isActive: false}
          if (activeCategoryIDs.includes(category.id)) {
            category.isActive = true          
            newActiveCategories.push(category)
          }
          newCategories.push(category)
        }
      });

      if (newActiveCategories.length === 0) {
        newCategories[0].isActive = true;
        newActiveCategories.push(newCategories[0])
      }
    }      

    updateNewsCount(newActiveCategories)
    setActiveCategories(newActiveCategories)         
    updateData(newActiveCategories)
    setCategories(newCategories)
  }

  const updateNewsCount = (categories: category[]) => {
    let newNewsCount = 0;
    if (categories.length > 0) {
      categories.forEach((category: category) => {
        newNewsCount += category.newsCount
      })
    }
    setNewsCount(newNewsCount)
  }

  const getIdsUrl = (categories: category[]): string => {
    let ids: string = ""
    categories.forEach((category: category) => {
      ids += `${category.id},`
    })
    if (ids.length === 0) { ids = '0' }
    return ids;
  }

  const updateData = async (categories: category[]) => {
    const ids = getIdsUrl(categories)
    const url = `https://www.kouvola.fi/wp-json/wp/v2/posts?categories=${ids}&per_page=10`;
    setIsLoading(true)
    const [data, err] = await fetchNews(url, 1);

    if (err) {
      setErrorMessage(
        translationData.Labels.finnish.ErrorMessages.ErrorLoadingNews,
      );
    } else {
      setNewsList(data);
      setCurrentPage(1)
    }            
    setIsLoading(false);     
  };

   const loadMore = async () => {
    const ids = getIdsUrl(activeCategories);
    const newPageToLoad = currentPage + 1;    
    const url = `https://www.kouvola.fi/wp-json/wp/v2/posts?categories=${ids}&per_page=10`;
    setIsLoading(true);
    const [data, err] = await fetchNews(url, newPageToLoad);

    if (err) {
      setErrorMessage(
        translationData.Labels.finnish.ErrorMessages.ErrorLoadingNews,
      );
      setIsLoading(false);
    }

    setNewsList([...newsList, ...data])
    setCurrentPage(newPageToLoad);
    setIsLoading(false);
  };

  const renderNewsArticles = () => {    
    return (newsCount > 0) ? 
      newsList.map(article => (
        <ArticleTitle key={article.id} isScrolling={props.isScrolling} article={article} navigation={props.navigation} />        
      )) : (
      <View style={styles.noneSelectedContainer} accessible={true}>
        <Text style={styles.noneSelectedText}>{translationData.Labels.finnish.ErrorMessages.NoneSelected}</Text>
      </View>
    )
  }

  const editActiveCategories = async (category: category) => { 
    let index = activeCategories.indexOf(category);
    let newCategories = activeCategories;
    if (index !== -1) {  
      index === 0 ? newCategories.shift() : newCategories.splice(index, 1)            
    } else {
      newCategories = [...activeCategories, category];
    }

    let activeCategoryIDs: number[] = newCategories.map((cat) => {
      return cat.id
    })
    await AsyncStorage.setItem("activeCategoryIDs", JSON.stringify(activeCategoryIDs))
    setActiveCategories(newCategories)
    updateNewsCount(newCategories)    
    setNewsList([])
    updateData(newCategories)        
  }

  return (
    <View style={styles.newsContainer}>
      <NavBar 
        data={categories} 
        setData={setCategories} 
        changeCategory={editActiveCategories} 
        returnToTop={props.returnToTop} 
        isScrolling={props.isScrolling}
      />
      {renderNewsArticles()}      
      {isLoading ? ( 
        <ActivityIndicator
          style={styles.loaderStyle}
          size='large'
          color='gray'
        />
      ) : (
        <>
          {errorMessage !== '' ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorMessage}>{errorMessage}</Text>
            </View>
            ) : ( newsCount > currentPage * 10) && (            
              <View>
                <TouchableOpacity
                  accessibilityRole='button'
                  style={styles.fetchMoreButton}
                  onPress={loadMore}>
                  <Text style={styles.buttonText}  accessible={false}>
                    {translationData.Labels.finnish.Screens.Home.LoadMore}
                  </Text>
                </TouchableOpacity>
              </View>
          )}
        </>
      )}
    </View>
  );
};