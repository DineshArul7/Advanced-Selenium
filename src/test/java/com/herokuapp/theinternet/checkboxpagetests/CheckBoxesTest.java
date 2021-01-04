package com.herokuapp.theinternet.checkboxpagetests;

import org.testng.Assert;
import org.testng.annotations.Test;

import com.herokuapp.theinternet.base.TestUtilities;
import com.herokuapp.theinternet.pages.CheckboxesPage;
import com.herokuapp.theinternet.pages.WelcomePage;

public class CheckBoxesTest extends TestUtilities{

	@Test
	public void selectingTwoCheckboxesTest() {
		log.info("Starting selectingtwocheckbox Test");
	//open main page
		WelcomePage welcomepage=new WelcomePage(driver,log);
	welcomepage.openPage();
	
	//click on Checkbox link
	CheckboxesPage checkboxespage=welcomepage.ClickCheckboxesLink();
	
	//select all checkboxes
	checkboxespage.selectAllCheckboxes();
	
	//verify all check boxes are checked
	Assert.assertTrue(checkboxespage.areAllCheckboxesChecked(), "Not all check boxes are checked");
	}
	
}
