package com.herokuapp.theinternet.dropdowntests;

import org.testng.Assert;
import org.testng.annotations.Test;

import com.herokuapp.theinternet.base.TestUtilities;
import com.herokuapp.theinternet.pages.DropdownPage;
import com.herokuapp.theinternet.pages.WelcomePage;

public class DropdownPageTest extends TestUtilities{

	@Test
	public void optionTwoTest() {
		log.info("Starting optionTwo Test");
		
		//open main page
				WelcomePage welcomepage=new WelcomePage(driver,log);
			welcomepage.openPage();
			//click on Dropdown link
			DropdownPage dropdownpage=welcomepage.clickDropdowLink();
			//Select option Two
			dropdownpage.selectOption(2);
			//Verify option 2 is selected
			Assert.assertTrue(dropdownpage.getSelectedOption().equals("Option 2"), "Option 2 is not selected instead "+dropdownpage.getSelectedOption()+ "is selected");
	}
}
