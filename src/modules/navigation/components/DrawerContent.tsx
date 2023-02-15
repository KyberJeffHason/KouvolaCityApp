import React, { useEffect } from 'react';
import { View, Text, AccessibilityInfo } from 'react-native';
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItem,
  useDrawerStatus
} from '@react-navigation/drawer';
import {
  I18nManager,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
} from "react-native";

import DrawerHeader from './headers/DrawerHeader';
import styles from './headers/styles';
import { ERouteName } from '../typings';
import translationData from 'config/locales.json';

import i18n from "i18n-js";
import memoize from "lodash.memoize";
import * as RNLocalize from "react-native-localize";

const translationGetters = {
  // lazy requires
  en: () => require("config/en.json"),
  fn: () => require("config/fn.json"),
};

const translate = memoize(
  (key, config) => i18n.t(key, config),
  (key, config) => (config ? key + JSON.stringify(config) : key),
);

const setI18nConfig = () => {
  // fallback if no available language fits
  const fallback = { languageTag: "en", isRTL: false };

  const { languageTag, isRTL } =
    "fn" ||
    fallback;

  // clear translation cache
  translate.cache.clear();
  // update layout direction
  I18nManager.forceRTL(isRTL);

  // set i18n-js config
  i18n.translations = {
    [languageTag]: translationGetters[languageTag](),
  };

  i18n.locale = languageTag;
};



type navigationType =  "Home" | "LibraryCard" | "RoutePlanners" | "Visit" | 
"Enquiries" | "TrimbleFeedBack" | "KouvolaJoukkoliikenne" | "Events" |  "Feedback"

const navigationData: {name: navigationType, route: ERouteName}[] = [
  {name: "Home", route: ERouteName.HOME},
  {name: "LibraryCard", route: ERouteName.LIBRARY_CARD},
  {name: "RoutePlanners", route: ERouteName.ROUTE_PLANNER},
  {name: "Visit", route: ERouteName.VISIT_KVL},
  {name: "Enquiries", route: ERouteName.ENQUIRY},  
  {name: "TrimbleFeedBack", route: ERouteName.TRIMBLE_FEEDBACK_REDIRECT},
  {name: "KouvolaJoukkoliikenne", route: ERouteName.WALTTI_MOBIILI_REDIRECT},
  {name: "Events", route: ERouteName.EVENTS},
  {name: "Feedback", route: ERouteName.FEEDBACK},
]

var lang = "fn";

const createDrawerContent = (navigation: any) => {  
  return navigationData.map(({name, route}: {name: navigationType, route: ERouteName}) => {
    return (
      <DrawerItem          
        key={`drawer-item-${name}`}
        label={() => generateItemLabels(name)}
        style={styles.headerItem}
        pressColor={'white'}
        activeBackgroundColor={'#212121'}          
        onPress={generateOnItemPressHandler({
          navigation: navigation,
          route: route,
        })}            
      />
    )
    })
}

type TGenerateOnItemPressHandlerParams = Pick<
  DrawerContentComponentProps,
  'navigation'
> & {
  route: ERouteName;
};

const generateOnItemPressHandler =
  ({ navigation, route }: TGenerateOnItemPressHandlerParams) =>
  () => {
    navigation.closeDrawer();
    navigation.navigate(route);
  };

  const generateItemLabels = (item: navigationType): JSX.Element => {
    var externalApp = (item === "TrimbleFeedBack" || item=== "KouvolaJoukkoliikenne")
    var labelText = (externalApp) ? translate(item)
      : translate(item)
    var accessibilityText = (externalApp) ? translate(item)
      : translate(item)

      if(lang == "en") {
          labelText = (externalApp) ? translationData.Labels.english.ExternalApps[item]
            : translationData.Labels.english.Navigation[item]
          accessibilityText = (externalApp) ? translationData.Accessibility.english.ExternalApps[item]
            : translationData.Accessibility.english.Navigation[item]
      }
  
    return (
      <Text style={styles.headerLabel} accessibilityLabel={accessibilityText}>{labelText}</Text>
    )
  };

const DrawerContent = (props: DrawerContentComponentProps): JSX.Element => {

  const isDrawerOpen = useDrawerStatus();

  useEffect(()=> {
    if(isDrawerOpen === 'open') {
    AccessibilityInfo.announceForAccessibility(
      translationData.Accessibility.finnish.Navigation.OpenedMenu,
    );}
  },[isDrawerOpen])

  return (
    <View style={styles.headerMenu}>
      <DrawerHeader {...props} />
      <DrawerContentScrollView>
      {createDrawerContent(props.navigation)}
      </DrawerContentScrollView>
    </View>
  );
};

export default DrawerContent;
